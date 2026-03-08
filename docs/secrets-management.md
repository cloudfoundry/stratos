# Secrets Management — Zero Plaintext on Disk

This guide describes how to manage secrets so that plaintext credentials never
persist on disk. Stratos E2E tests are the reference implementation, but the
pattern applies to any project.

## Why

Plaintext secrets on disk are an unnecessary risk:

- Leaked via accidental commits, backups, or shared filesystems
- Persist indefinitely unless manually removed
- Visible to any process running as the same user

The goal: secrets only exist in memory while they are in use.

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│   Bitwarden      │     │  SOPS + age      │
│  (primary)       │     │  (offline)       │
│                  │     │                  │
│  bw get notes    │     │  sops -d file    │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────┐
    │   STRATOS_SECRETS env var       │
    │   (raw YAML, in memory only)   │
    └────────────────┬────────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │  SecretsHelper   │
           │  .load()         │
           └──────────────────┘
```

**Primary — Bitwarden:** Secrets are fetched from a shared Bitwarden vault and
injected as an environment variable. Nothing is written to disk.

**Offline — SOPS+age:** An encrypted file (`secrets.yaml.enc`) can be decrypted
directly into the environment variable. The plaintext never touches the
filesystem.

**Legacy — secrets.yaml file:** Still supported as a last resort, but
discouraged.

### What are SOPS and age?

**[age](https://github.com/FiloSottile/age)** is a simple, modern file
encryption tool. It uses public-key cryptography: you encrypt with a public key
(`age1...`) and decrypt with the corresponding private key. No passwords, no
key servers, no configuration — just a keypair in a file.

**[SOPS](https://github.com/getsops/sops)** (Secrets OPerationS) is a tool for
encrypting structured files (YAML, JSON, ENV). Unlike full-file encryption,
SOPS encrypts only the *values* while leaving keys and structure visible. This
means you can `git diff` an encrypted file and see which fields changed, without
exposing the actual secrets. SOPS uses age (or other backends like AWS KMS) for
the actual cryptographic operations.

## Where Secrets Live in Bitwarden

| Field | Convention | Example |
|-------|-----------|---------|
| Organization | FiveTwenty Inc. | — |
| Collection | `{Category}/{Area}` | `FiveTwenty/R&D`, `Clients/Travelers` |
| Item type | Secure Note for multi-line configs, Login for service creds | — |
| Item name | `{project}-{environment}-{purpose}` | `stratos-e2e-secrets` |

Examples:

- `FiveTwenty/R&D` → `stratos-e2e-secrets` (Secure Note, shared team secrets)
- `Clients/Travelers` → `travelers-staging-api-key` (Login, client project)
- My vault (personal) → `dev-signing-key` (personal dev credentials)

## Prerequisites

### Install tools

```bash
brew install bitwarden-cli sops age
```

### Generate age keypair

Generate a keypair and store it where SOPS expects to find it:

```bash
# macOS (SOPS default location)
mkdir -p "$HOME/Library/Application Support/sops/age"
age-keygen -o "$HOME/Library/Application Support/sops/age/keys.txt"

# Linux (XDG default)
mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/sops/age"
age-keygen -o "${XDG_CONFIG_HOME:-$HOME/.config}/sops/age/keys.txt"
```

You can also set `SOPS_AGE_KEY_FILE` to point to any location.

Save the public key (`age1...`) printed during generation — you will need it
for `.sops.yaml`.

### Store secrets in Bitwarden

You can create the Secure Note via the web/desktop app or the CLI:

```bash
# Create from the template (edit with actual values afterwards)
./scripts/secrets.sh create-note

# Or from an existing secrets.yaml file
./scripts/secrets.sh create-note secrets.yaml
```

Then edit the note contents with your actual credentials (web UI or
`bw edit item <id>`).

### Bitwarden session management

> **Important:** `bw unlock` creates a session token (`BW_SESSION`) that is
> local to the current shell. Every new terminal needs its own
> `export BW_SESSION=...`. The `bw unlock --check` command also requires
> `BW_SESSION` to be set — without it, the vault always appears locked even
> if you unlocked it in another terminal.
>
> ```bash
> export BW_SESSION=$(bw unlock --raw)
> # This session is only valid in this shell
> ```

### Validate setup

```bash
./scripts/secrets-check.sh
```

## Implementing for Your Project

### 1. Add env var injection

Modify your secrets/config loader to check an environment variable first,
falling back to a file only if the env var is absent:

```typescript
const envSecrets = process.env.MY_PROJECT_SECRETS;
if (envSecrets) {
  return parse(envSecrets);
}
// Fall back to file...
```

### 2. Create a fetch-and-run wrapper

```bash
#!/usr/bin/env bash
export MY_PROJECT_SECRETS=$(bw get notes "my-project-secrets")
exec my-command "$@"
```

### 3. Set up SOPS for offline use

Create `.sops.yaml` in the project root to document your age public key:

```yaml
creation_rules:
  - path_regex: secrets\.yaml\.enc$
    age: >-
      age1your_public_key_here
```

Encrypt secrets (using a temp file — SOPS does not reliably read from stdin):

```bash
tmpfile=$(mktemp)
bw get notes "my-project-secrets" > "$tmpfile"
SOPS_AGE_RECIPIENTS="age1..." sops --encrypt \
  --input-type yaml --output-type yaml --config /dev/null \
  "$tmpfile" > secrets.yaml.enc
rm "$tmpfile"
```

Decrypt to env var:

```bash
export MY_PROJECT_SECRETS=$(sops -d \
  --input-type yaml --output-type yaml --config /dev/null \
  secrets.yaml.enc)
```

The `--config /dev/null` flag skips `.sops.yaml` matching (which fails on
temp files). The `--input-type` and `--output-type` flags are needed because
SOPS cannot always infer the format from the filename.

### 4. Gitignore all secrets artifacts

```gitignore
secrets.yaml
secrets.yaml.enc
```

Both the plaintext and encrypted files should be gitignored. The encrypted file
is a local convenience — team members generate their own from Bitwarden.

## Daily Workflow

### With Bitwarden (online)

```bash
# One command — fetches secrets, runs tests, secrets vanish when process exits
npm run e2e:bw
```

### With SOPS (offline / disconnected)

```bash
# Create encrypted file once (or when secrets change)
./scripts/secrets.sh encrypt

# Run tests from encrypted file
npm run e2e:offline
```

### Legacy file (not recommended)

```bash
cp e2e/secrets.yaml.template secrets.yaml
# Edit secrets.yaml
npm run e2e
# Remember to delete secrets.yaml when done
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `bw: command not found` | `brew install bitwarden-cli` |
| `Vault is locked` | `export BW_SESSION=$(bw unlock --raw)` — required per shell |
| `Vault is locked` (after unlocking) | `BW_SESSION` is per-shell; re-export in each new terminal |
| `Not logged in` | `bw login` |
| `Item not found` | Verify the Secure Note name matches `stratos-e2e-secrets` |
| `sops: command not found` | `brew install sops` |
| `age-keygen: command not found` | `brew install age` |
| `Failed to decrypt` / key not found | Ensure age `keys.txt` is in the platform default location or set `SOPS_AGE_KEY_FILE` |
| `no matching creation rules` | Scripts use `--config /dev/null`; check you're using `scripts/secrets.sh` not raw `sops` |
| `STRATOS_SECRETS is empty` | Check that `bw get notes` returns content; item may be empty |
