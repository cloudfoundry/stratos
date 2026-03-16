# Secrets Management & Packaging Completion

## Tickets

```
Ticket   Summary                              Status
───────  ───────────────────────────────────  ──────────
FWT-748  Multi-env secrets (--env flag)       Done
FWT-749  Document secrets workflow            Done
FWT-750  Build secrets-expert Claude agent    Done
FWT-658  Packaging verification              Done
FWT-677  Playwright E2E test coverage        In Progress
```

## Phase 1: FWT-748 — Multi-env secrets support [DONE]

### ACs
- [x] 10. `scripts/secrets.sh` supports `--env` flag
- [x] 11. Per-env files: `secrets.<env>.yaml.enc` naming
- [x] 12. Default (no flag) falls back to single-env behavior

### What was done
Created `scripts/secrets.sh` with encrypt/decrypt/run-e2e/check
subcommands, OpenSSL and SOPS+age backends, `--env` flag for
per-environment files.

Updated `SecretsHelper` to check `STRATOS_SECRETS` env var first,
then `secrets.<env>.yaml`, then `secrets.yaml`. Extracted `parse()`
and `resolveSecretsPath()` methods.

Updated `.gitignore` for `secrets.*.yaml` pattern and removed
duplicate `secrets.yaml` entry.

### Files changed
- Created: `scripts/secrets.sh`
- Modified: `e2e/helpers/secrets-helpers.ts`
- Modified: `.gitignore` (added `secrets.*.yaml`, removed duplicate)

### Design decisions
- Script is self-contained with no repo-specific paths — portable
  to other projects without modification
- Two backends (openssl, sops) selected via `--backend` flag or
  `STRATOS_SECRETS_BACKEND` env var
- `run-e2e` injects via `STRATOS_SECRETS` env var so plaintext
  never touches disk in CI
- `--env` maps to file naming (`secrets.<env>.yaml`), not profiles
- Profiles (`STRATOS_E2E_PROFILE`) select sections within a file
- Environments and profiles compose independently

### Prior state preserved
- Existing `e2e/scripts/secrets-encrypt.sh` and
  `e2e/scripts/secrets-decrypt.sh` still work (legacy, not removed)
- `STRATOS_E2E_PROFILE` env var still works as before
- `secrets.yaml` at repo root still works as before

## Phase 2: FWT-749 — Documentation [DONE]

### ACs
- [x] 1. Three secrets methods with examples
- [x] 2. Architecture diagram (two-component: script + loader)
- [x] 3. Naming conventions (file patterns, env var names)
- [x] 4. Prerequisite install instructions
- [x] 5. Daily workflows (local dev, CI, switching envs, updating)
- [x] 6. Troubleshooting table
- [x] Loader templates (TypeScript, Bash, Python, Perl)
- [x] Why SOPS + age section explaining the tools

### Files changed
- Created: `docs/secrets-management.md`

### Design decisions
- Document explains two-component architecture: `secrets.sh`
  (portable Bash, handles encryption) and secrets loader
  (language-specific, handles YAML parsing)
- Loader contract defined so any language can implement it
- Reference implementations provided for Bash, Python, Perl
  alongside the existing TypeScript implementation
- Tables use fixed-width format instead of markdown pipes for
  terminal readability

## Phase 3: FWT-750 — Secrets expert agent [DONE]

### ACs
- [x] 1. Agent config in `agents/secrets-expert.md` (ocfp-studio)
- [x] 2. Instructions cover all subcommands
- [x] 3. Manages FiveTwenty, stratos, cf-community
- [x] 4. Org/repo list is YAML config, not code
- [x] 5. Validates prerequisites before operations
- [x] 6. Follows zero-plaintext pattern
- [x] 7. Supports Secure Note and Login item types
- [x] 8. Registered in CLAUDE.md expert agents table

### Files changed (in ocfp-studio, not cf-stratos)
- Created: `agents/secrets-expert.md`
- Modified: `CLAUDE.md` (added to expert agents table)

### Design decisions
- Agent has Bash tool access for running secrets.sh, sops, age, bw
- Org/repo registry is in the agent config YAML frontmatter —
  adding a new target is a config change, not a code change
- Agent follows existing expert pattern (user-expert for ops)
- Bitwarden conventions: one collection per project, item naming
  as `<project>/<env>/secrets.yaml`

## Phase 4: FWT-658 — Packaging verification [DONE]

### Verification results
```
Target               Result
───────────────────  ──────────────────────────────────────
make release cf      54M zip, correct Procfile/manifest
make release github  7 archives (6 platform + 1 source)
make stage           Correctly rejects when artifacts missing
make dump version    Resolves all semver/VCS metadata
```

### Package contents verified
- CF zip: jetstream binary, ui/, config.properties, plugins.yaml,
  templates/, Procfile, manifest.yml
- GitHub archives: bin/jetstream, ui/, config/, deploy/, docs,
  VERSION, README.txt
- Source archive: git archive with correct exclusions

### Known issue
- `manifest.yml` has hardcoded ENCRYPTION_KEY placeholder
  (documented in FWT-788, already marked Done)

## Phase 5: FWT-677 — More Playwright tests [PENDING]

### Current state
- 54 total test files, all imported from Playwright test-base
- 11 active (not skipped)
- 43 skipped (migrated from Protractor but not yet verified)

### Active tests
```
core/login.spec.ts
core/home.spec.ts
core/home-layout.spec.ts
core/app.spec.ts
core/check.spec.ts
core/endpoints.spec.ts
core/api-keys.spec.ts
cloud-foundry/cf-level/cf-card-list-pagination.spec.ts
application/application-view.spec.ts
application/application-delete.spec.ts
cloud-foundry/space-level/cf-space-delete.spec.ts
```

### High-value next targets
- Un-skip and verify `cf-top-level.spec.ts`
- Un-skip and verify `login-sso.spec.ts`
- Un-skip and verify `application-wall.spec.ts`
- Add endpoint connection/disconnection tests
