---
id: sqlite-persistence
title: Persisting the SQLite database
sidebar_label: SQLite persistence
---

When Stratos is pushed to Cloud Foundry without a bound database service it
falls back to an embedded SQLite database on the container's ephemeral disk.
Every push, restart, or crash recreates the container and wipes that database:
registered endpoints reappear through auto-registration, but user tokens,
favorites, and settings are lost.

[Binding a Postgres or MySQL service](db-migration.md) is the recommended fix.
When that is not an option, the SQLite database itself can be made recoverable.
Two approaches are described here — both depend on two hard preconditions.

## Precondition: keep the database file across restarts

By default jetstream **deletes the SQLite database file at startup** and
recreates it empty — a clean slate is the historical assumption for the
ephemeral-disk case. Any restore-before-launch scheme silently loses to that
delete: the wrapper script rebuilds the database, jetstream removes it moments
later, and every boot looks like a fresh install. Under Litestream the failure
compounds — the replicator then streams the freshly emptied database over the
replica's latest state, so the backup's head is overwritten by the very
mechanism meant to protect it (earlier state remains recoverable with
`litestream restore -txid`/`-timestamp` until compaction retires it).

Set `SQLITE_KEEP_DB` as a persisted application environment variable before
adopting either approach:

```bash
cf set-env console SQLITE_KEEP_DB true
```

## Precondition: a stable encryption key

Tokens are encrypted at rest with the key configured through
`ENCRYPTION_KEY` (or the key volume/file settings). If the key is regenerated
on each deployment, any recovered database decrypts to nothing useful. Set the
key once as a persisted application environment variable
(`cf set-env console ENCRYPTION_KEY <64-hex-chars>`) and keep the deployment
manifest from overwriting it. The key and the data must persist together.

## Approach 1: continuous replication with Litestream

[Litestream](https://litestream.io) tails the SQLite WAL and streams it to
external storage (S3-compatible object stores, SFTP hosts, and others). Run
jetstream under Litestream's process supervision and the database survives
container churn with at most a second or so of data loss:

1. Include the `litestream` Linux binary and a `litestream.yml` in the
   application package, alongside the `jetstream` binary:

   ```yaml
   dbs:
     - path: /home/vcap/app/console-database.db
       replicas:
         - type: sftp                      # or s3, abs, gcs …
           host: replica-host:22
           user: replica-user
           key-path: /home/vcap/app/replica_key
           path: /replica-dir/console-database
   ```

2. Replace the application start command with a wrapper script:

   ```bash
   #!/bin/bash
   set -e
   cd /home/vcap/app
   if timeout 5 bash -c 'echo > /dev/tcp/replica-host/22' 2>/dev/null; then
     if [ ! -f console-database.db ]; then
       timeout 30 ./litestream restore -config litestream.yml \
         -if-replica-exists /home/vcap/app/console-database.db || \
         echo "restore unavailable (rc=$?) - starting fresh"
       echo "restore done, size=$(stat -c%s console-database.db 2>/dev/null || echo none)"
     fi
     exec ./litestream replicate -config litestream.yml -exec ./jetstream
   fi
   echo "replica target unreachable - running without replication"
   exec ./jetstream
   ```

   A fresh container restores the last replicated state before jetstream
   opens the database; `-exec` then keeps replication running for the life of
   the process and exits when jetstream exits.

   The guards are not decorative. Litestream initializes its replicas
   *before* spawning the `-exec` child, so an unreachable replica target
   blocks jetstream from ever starting — the reachability preflight falls
   back to an unreplicated launch instead of a crash-loop, and the `timeout`
   on the restore bounds the health-check window. Log the restored file size:
   `litestream restore` is silent both when it restores and when
   `-if-replica-exists` makes it a no-op (both exit 0), and the two are
   otherwise indistinguishable from the platform log stream.

Notes:

- The container needs network egress to the replica target. Cloud Foundry
  application security groups typically exclude private ranges, so a scoped
  ASG (single destination host and port) may be required — and the
  infrastructure between the cells and the target (per-VM firewalls,
  inter-subnet routing) has to pass the traffic too. Verify with a TCP probe
  from inside the app container, not from the target's side.
- Litestream switches the database to WAL journal mode. Jetstream's pure-Go
  SQLite driver interoperates with Litestream's WAL handling (the pairing is
  exercised by the pattern above), coordinating through SQLite's
  cross-process locking — still validate the combination in a non-production
  environment before relying on it.
- Replica credentials (SSH key or object-store keys) travel inside the
  application package; scope them to the replica target only.

## Approach 2: snapshot into a user-provided service

The Cloud Controller's own database can act as the persistent store: a
user-provided service instance holds a snapshot of the SQLite file, and the
application restores from it at boot. Whoever pushes Stratos already has the
credentials to update the service instance, so the save step is part of the
push ritual rather than something the application must be trusted to do.

Save (operator, before or after a push):

```bash
cf ssh console -c 'cat /home/vcap/app/console-database.db' | base64 > db.b64
cf uups console-db-snapshot -p "{\"db\": \"$(cat db.b64)\"}"
cf bind-service console console-db-snapshot
```

Restore (start wrapper, before launching jetstream): read the snapshot from
the service binding, decode it, and write `console-database.db` if the file
does not exist.

The environment-variable route caps out quickly — Cloud Foundry limits an
app's total environment (including `VCAP_SERVICES`) to roughly 130KB, and
even a small Stratos database exceeds that once base64-encoded. The
`file-based-vcap-services` application feature exists for exactly this: with
it enabled, the platform writes service bindings to a file and sets
`VCAP_SERVICES_FILE_PATH` instead of injecting the JSON into the environment,
lifting the size ceiling (a 250KB credential blob round-trips through the
Cloud Controller intact):

```bash
cf curl v3/apps/$(cf app console --guid)/features/file-based-vcap-services \
  -X PATCH -d '{"enabled": true}'
```

Caveats:

- Jetstream reads `VCAP_SERVICES` from the environment for bound-database
  detection and user-provided-service configuration lookup. With the
  file-based feature enabled those variables are no longer set, so both
  code paths quietly fall back to SQLite — acceptable when SQLite is the
  point, but incompatible with a bound database service on the same app
  (support requires go-cfenv ≥ 1.23, which reads the file path).
- Snapshots capture a moment in time; anything written after the last save
  is lost. Pair with Approach 1 when crash-loss matters.

## Choosing

| | Litestream | Service snapshot |
|---|---|---|
| Data loss window | ~1s | Since last snapshot |
| New infrastructure | Replica target (object store / SFTP host) + ASG | None |
| Operator ritual | None after setup | Save on each push |
| Moving parts in the container | Litestream supervises jetstream | Start wrapper only |

Both are recovery patterns for deployments that deliberately stay on SQLite —
a bound database service remains the recommendation for production.
