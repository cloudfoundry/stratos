# Secrets Management

Zero-plaintext secrets workflow for E2E tests and local development.

## Architecture

There are two components:

**`scripts/secrets.sh`** — a portable Bash script that handles
encryption, decryption, and in-memory injection. It knows nothing
about YAML structure. It treats secrets files as opaque blobs.

**Secrets loader** — a language-specific module that parses the
YAML content and provides structured access to credentials. In this
project it is `SecretsHelper` (TypeScript) because the E2E tests use
Playwright. Other projects would write their loader in whatever
language their test framework uses (Python, Go, Ruby, etc.).

The two components connect via the `STRATOS_SECRETS` environment
variable. The script decrypts and injects; the loader reads and parses.

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│  secrets.yaml   │────▶│ secrets.sh   │────▶│ secrets.yaml.enc │
│  (plaintext)    │     │ encrypt      │     │ (encrypted, git) │
│  .gitignored    │     └──────────────┘     └──────────────────┘
└─────────────────┘            │
        ▲                      │ decrypt
        │                      ▼
┌───────┴─────────┐     ┌──────────────┐     ┌──────────────────┐
│ Secrets loader  │◀────│ secrets.sh   │◀────│ secrets.yaml.enc │
│ (any language)  │     │ run-e2e      │     │ (encrypted, git) │
└─────────────────┘     └──────────────┘     └──────────────────┘
                               │
                    STRATOS_SECRETS env var
                    (in-memory, never on disk)
```

Plaintext secrets never persist on disk in CI. For local development,
`secrets.yaml` is `.gitignored` and can be deleted after encrypting.

## Why SOPS + age

**OpenSSL** (the default backend) encrypts with a shared passphrase.
Everyone who needs access must know the passphrase, and rotating it
means re-distributing it to the whole team. It works for solo use
but breaks down with multiple contributors.

**SOPS** (Secrets OPerationS) is Mozilla's tool for encrypting
structured files (YAML, JSON, ENV). Unlike OpenSSL which encrypts
the entire file as a binary blob, SOPS encrypts individual values
while leaving keys and structure visible. This means `git diff`
shows *which* fields changed even though the values are opaque.

**age** is a modern, minimal encryption tool — think of it as the
successor to GPG without the complexity. Each person generates a
keypair: a public key (starts with `age1...`) and a private key.
The public keys are listed in `.sops.yaml` so SOPS knows who can
decrypt. The private key stays on your machine.

Together they solve the team secrets problem:

- No shared passphrase to manage or rotate
- Add a team member by adding their public key to `.sops.yaml`
- Remove access by removing their key and re-encrypting
- Diffs remain readable in pull requests
- Private keys never leave individual machines

## Prerequisites

```
Tool       Required for        Install
─────────  ──────────────────  ──────────────────────────
openssl    Default backend     Pre-installed on macOS/Linux
sops       SOPS backend        brew install sops
age        SOPS backend        brew install age
```

Check your setup:

```bash
scripts/secrets.sh check                  # openssl (default)
scripts/secrets.sh check --backend sops   # sops + age
```

## Secrets Methods

### 1. Plaintext file (local development)

Simplest approach — keep `secrets.yaml` on disk while developing.

```bash
cp e2e/secrets.yaml.template secrets.yaml
# Edit with your credentials
bunx playwright test
```

The file is `.gitignored`. Never commit it.

### 2. OpenSSL encrypted file (default)

Encrypt with a passphrase, decrypt when needed.

```bash
# Encrypt
scripts/secrets.sh encrypt

# Decrypt
scripts/secrets.sh decrypt

# Run tests without plaintext on disk
scripts/secrets.sh run-e2e
```

### 3. SOPS + age (recommended for teams)

Uses public-key encryption. No shared passphrase needed — each team
member's age public key is listed in `.sops.yaml`.

```bash
# First-time setup: generate an age keypair
age-keygen -o ~/.config/sops/age/keys.txt

# Share your public key (age1...) with the team for .sops.yaml

# Encrypt / decrypt
scripts/secrets.sh encrypt --backend sops
scripts/secrets.sh decrypt --backend sops

# Run tests without plaintext on disk
scripts/secrets.sh run-e2e --backend sops
```

Set the default backend to avoid typing `--backend sops` every time:

```bash
export STRATOS_SECRETS_BACKEND=sops
```

## Multi-Environment Support

Use `--env` to manage per-environment secrets files:

```bash
# Encrypt per-environment files
scripts/secrets.sh encrypt --env local
scripts/secrets.sh encrypt --env staging

# Decrypt a specific environment
scripts/secrets.sh decrypt --env local

# Run tests against a specific environment
scripts/secrets.sh run-e2e --env staging -- --headed
```

File naming convention:

```
Flag              Plaintext file          Encrypted file
────────────────  ──────────────────────  ──────────────────────────
(none)            secrets.yaml            secrets.yaml.enc
--env local       secrets.local.yaml      secrets.local.yaml.enc
--env staging     secrets.staging.yaml    secrets.staging.yaml.enc
```

All `secrets.*.yaml` files are `.gitignored`. Encrypted `.enc` files
can be committed if the team wants shared encrypted secrets in the repo.

## Profiles vs Environments

**Environments** (`--env`) select which *file* to load — one file per
deployment target (local Stratos, staging, production).

**Profiles** (`STRATOS_E2E_PROFILE`) select which *section within a file*
to use — useful when a single secrets file has credentials for multiple
CF endpoints.

These compose: `--env staging` loads `secrets.staging.yaml`, and
`STRATOS_E2E_PROFILE=us-east` selects the `us-east` profile within that
file.

## Environment Variables

```
Variable                  Purpose                              Default
────────────────────────  ───────────────────────────────────  ────────────────────────
STRATOS_SECRETS           YAML content injected by run-e2e     (none)
STRATOS_E2E_ENV           Environment name for file selection   (none)
STRATOS_E2E_PROFILE       Profile name within secrets file      (none)
STRATOS_E2E_BASE_URL      Override Stratos URL                  https://localhost:5440
STRATOS_SECRETS_BACKEND   Default encryption backend            openssl
SOPS_AGE_KEY_FILE         Path to age private key               ~/.config/sops/age/keys.txt
```

## Secrets Loader

The loader is the language-specific piece that parses YAML content
and provides structured access to credentials. Each project writes
its own loader in the language of its test framework.

### Load order

The loader checks these sources in priority order:

1. `STRATOS_SECRETS` env var (set by `scripts/secrets.sh run-e2e`)
2. `secrets.<env>.yaml` file (when `STRATOS_E2E_ENV` is set)
3. `secrets.yaml` file (default)

First source found wins. Within the loaded content,
`STRATOS_E2E_PROFILE` selects a named profile if present.

### Loader contract

Any loader implementation should:

1. Check for a `STRATOS_SECRETS` env var first (YAML string)
2. Fall back to file on disk
3. Support profile selection within the parsed content
4. Return structured credentials to the test framework

This project's TypeScript loader (`e2e/helpers/secrets-helpers.ts`)
is a reference implementation. Below are starter templates for
common languages. Each follows the same contract — adapt the
return structure to match your project's secrets schema.

### Bash

```bash
#!/usr/bin/env bash
# secrets-loader.sh — source this or call as a function

secrets_load() {
  local env="${STRATOS_E2E_ENV:-}"
  local content=""

  # Source 1: env var
  if [[ -n "${STRATOS_SECRETS:-}" ]]; then
    content="${STRATOS_SECRETS}"
  else
    # Source 2: env-specific file
    local file="secrets.yaml"
    [[ -n "${env}" ]] && file="secrets.${env}.yaml"
    if [[ ! -f "${file}" ]]; then
      echo "Error: secrets not found" >&2
      return 1
    fi
    content="$(cat "${file}")"
  fi

  # Parse with yq (install: brew install yq)
  # Adapt these field paths to your schema
  local profile="${STRATOS_E2E_PROFILE:-}"
  local prefix=""
  if [[ -n "${profile}" ]]; then
    prefix=".profiles.${profile}"
  fi

  ADMIN_USER="$(echo "${content}" | yq "${prefix}.consoleUsers.admin.username")"
  ADMIN_PASS="$(echo "${content}" | yq "${prefix}.consoleUsers.admin.password")"
  CF_URL="$(echo "${content}" | yq "${prefix}.endpoints.cf[0].url")"

  export ADMIN_USER ADMIN_PASS CF_URL
}
```

### Python

```python
#!/usr/bin/env python3
"""secrets_loader.py — load secrets from env var or file."""

import os
import yaml

def load_secrets():
    env = os.environ.get("STRATOS_E2E_ENV", "")
    content = os.environ.get("STRATOS_SECRETS", "")

    if not content:
        filename = f"secrets.{env}.yaml" if env else "secrets.yaml"
        if not os.path.exists(filename):
            raise FileNotFoundError(f"Secrets not found: {filename}")
        with open(filename) as f:
            content = f.read()

    raw = yaml.safe_load(content)

    profile = os.environ.get("STRATOS_E2E_PROFILE", "")
    if profile:
        if "profiles" not in raw or profile not in raw["profiles"]:
            available = list(raw.get("profiles", {}).keys())
            raise KeyError(f"Profile '{profile}' not found. Available: {available}")
        secrets = {**raw, **raw["profiles"][profile]}
    else:
        secrets = raw

    # Adapt this return structure to your schema
    return {
        "console": {
            "admin": secrets.get("consoleUsers", {}).get("admin", {}),
            "user": secrets.get("consoleUsers", {}).get("nonAdmin", {}),
        },
        "endpoints": secrets.get("endpoints", {}),
        "raw": secrets,
    }
```

### Perl

```perl
#!/usr/bin/env perl
# secrets_loader.pl — load secrets from env var or file.

use strict;
use warnings;
use YAML::XS qw(Load LoadFile);

sub load_secrets {
    my $env     = $ENV{STRATOS_E2E_ENV}     // '';
    my $content = $ENV{STRATOS_SECRETS}      // '';
    my $raw;

    if ($content) {
        $raw = Load($content);
    } else {
        my $file = $env ? "secrets.$env.yaml" : 'secrets.yaml';
        die "Secrets not found: $file\n" unless -f $file;
        $raw = LoadFile($file);
    }

    my $profile = $ENV{STRATOS_E2E_PROFILE} // '';
    my $secrets;

    if ($profile) {
        my $profiles = $raw->{profiles} // {};
        die "Profile '$profile' not found\n" unless $profiles->{$profile};
        $secrets = { %$raw, %{ $profiles->{$profile} } };
    } else {
        $secrets = $raw;
    }

    # Adapt this return structure to your schema
    return {
        console => {
            admin => $secrets->{consoleUsers}{admin}    // {},
            user  => $secrets->{consoleUsers}{nonAdmin}  // {},
        },
        endpoints => $secrets->{endpoints} // {},
        raw       => $secrets,
    };
}

1;
```

## Daily Workflows

### Local development (online)

```bash
# One-time: decrypt secrets
scripts/secrets.sh decrypt

# Run tests (reads secrets.yaml from disk)
bunx playwright test
```

### CI / secure environments

```bash
# Secrets never touch disk
scripts/secrets.sh run-e2e --backend sops -- --reporter=list
```

### Switching environments

```bash
# Test against local Stratos
scripts/secrets.sh run-e2e --env local

# Test against staging
scripts/secrets.sh run-e2e --env staging
```

### Updating secrets

```bash
# Decrypt, edit, re-encrypt
scripts/secrets.sh decrypt --env local
$EDITOR secrets.local.yaml
scripts/secrets.sh encrypt --env local
rm secrets.local.yaml   # optional: remove plaintext
```

## Troubleshooting

```
Problem                    Cause                              Fix
─────────────────────────  ─────────────────────────────────  ─────────────────────────────────────
Secrets file not found     No secrets.yaml, no env var        Run secrets.sh decrypt or copy template
Profile 'X' not found      STRATOS_E2E_PROFILE not in file    Check profiles: section in secrets file
bad decrypt (openssl)      Wrong passphrase                   Re-enter passphrase
no identity matched (sops) Age key not in .sops.yaml          Add your public key to .sops.yaml
age: no identity           Missing age key file               age-keygen -o ~/.config/sops/age/keys.txt
Tests fail with auth       Wrong credentials                  Verify creds match target environment
STRATOS_E2E_ENV ignored    No matching file on disk           Check secrets.<env>.yaml exists
```

## Adopting in Other Projects

`scripts/secrets.sh` is self-contained with no repo-specific paths.
To adopt in another project:

1. Copy `scripts/secrets.sh` to the new repo
2. Add `secrets.yaml` and `secrets.*.yaml` to `.gitignore`
3. Create a secrets template showing the expected YAML structure
4. Write a secrets loader in your project's language following
   the loader contract above (check env var, fall back to file,
   support profiles)
5. Rename the `STRATOS_*` env vars as appropriate for the project

The script resolves the repo root via `git rev-parse` and operates
on `secrets.yaml` relative to that root.
