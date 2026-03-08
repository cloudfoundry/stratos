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

```bash
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
```

Save the public key (`age1...`) — you will need it for `.sops.yaml`.

### Store secrets in Bitwarden

1. Open the Bitwarden vault (web or desktop)
2. Create a Secure Note named `stratos-e2e-secrets`
3. Paste the YAML content (see `e2e/secrets.yaml.template` for the format)
4. Save in the appropriate collection

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

Create `.sops.yaml` in the project root:

```yaml
creation_rules:
  - path_regex: secrets\.yaml\.enc$
    age: >-
      age1your_public_key_here
```

Encrypt secrets:

```bash
bw get notes "my-project-secrets" | sops --encrypt --age "age1..." /dev/stdin > secrets.yaml.enc
```

Decrypt to env var:

```bash
export MY_PROJECT_SECRETS=$(sops -d secrets.yaml.enc)
```

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
| `Vault is locked` | `bw unlock` and export `BW_SESSION` |
| `Not logged in` | `bw login` |
| `Item not found` | Verify the Secure Note name matches `stratos-e2e-secrets` |
| `sops: command not found` | `brew install sops` |
| `Failed to decrypt` | Ensure `~/.config/sops/age/keys.txt` exists and matches the public key in `.sops.yaml` |
| `age-keygen: command not found` | `brew install age` |
| `STRATOS_SECRETS is empty` | Check that `bw get notes` returns content; item may be empty |
