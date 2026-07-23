# Concourse pipeline

The modern Stratos Concourse pipeline. Every task is a thin caller of the
same `make` targets a developer or GitHub Actions runs — all build,
release, and audit logic lives in the Makefile and `build/` scripts, so
nothing here is Concourse-specific beyond the wiring. Tasks execute in
the shared tools image (`ci/tools-image/Dockerfile`, published to
`ghcr.io/cloudfoundry/stratos-ci`).

The legacy pipelines under `deploy/ci/` are unrelated and unmaintained;
this directory replaces them for CI purposes.

## Jobs

| Job | Trigger | Runs |
|-----|---------|------|
| `gate` | every commit on the tracked branch (default `develop`) | `make check gate` |
| `audit` | nightly | `make audit` + `make audit modrot` (report-only) |
| `release` | pushed `v*` tag | `make build` → `make release cf github` → `make publish` — same path as the `release.yml` GitHub Actions workflow; release notes come from the annotated tag body |

The all-in-one docker image build stays in GitHub Actions
(`release.yml`) for now — it needs a docker build/push, not a `make`
target.

## Deploying the pipeline

Operator-side requirements: [spruce](https://github.com/geofffranks/spruce/releases),
`jq`, and [fly](https://concourse-ci.org/fly.html). Concourse workers
need none of these — `repipe` merges everything locally and ships
fully-resolved YAML.

```bash
cp ci/settings.yml.example ci/settings.yml   # untracked; site-specific
# edit ci/settings.yml
./ci/repipe
```

`ci/pipeline.yml` is the structure file — don't put site values in it.
Required settings (spruce `(( param ))` asserts fail the merge loudly if
missing):

| Setting | Purpose |
|---------|---------|
| `meta.target` | fly target name of your Concourse |
| `meta.url` | Concourse URL |
| `meta.image.name` | tools image repository |
| `meta.github.access_token` | token for `make publish` and network-using scanners (use spruce's `(( vault ... ))` operator to keep it out of the file) |

Optional overrides: `meta.github.owner/repo/branch` (fork testing),
`meta.nightly.start/stop/location` (audit window), `meta.exposed`.

Target-specific settings files are supported:
`CONCOURSE_TARGET=<name> ./ci/repipe` prefers `ci/settings-<name>.yml`.

## Tools image

`ci/tools-image/Dockerfile`: node 24 + bun + go, gh CLI, and the full
`make audit` scanner set (gosec, govulncheck, trivy, osv-scanner,
gitleaks, modrot, zizmor). Rebuilt and pushed by the `ci-image.yml`
GitHub Actions workflow whenever the Dockerfile changes; GitHub Actions
jobs can consume the same image via `container:`. Deliberately absent
until a job needs them: ZAP (DAST workstream, #5679) and golangci-lint
(no lint job yet).
