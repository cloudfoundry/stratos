# version.mk — shared semver resolution and build metadata (vendorable)
#
# Drop this file into a repo unchanged and `include` it. Per-repo settings:
#   VERSION       Override the version string entirely (user-settable).
#   VERSION_CMD   Shell command that prints the version string. Default:
#                 nearest git tag, leading 'v' stripped, patch incremented
#                 ("the next release"). Repos with their own source set it
#                 before or after the include, e.g.:
#                   VERSION_CMD := node -p "require('./package.json').version"
#   BUILD_TZ      Timezone for BUILD_DATE_TZ: 'local' (default) or a zone
#                 name (e.g. UTC, America/New_York).
#   _HIDE         Internal-name prefix, default '_' (hides internals from
#                 tab completion). Set `_HIDE :=` (empty) before the include
#                 for plain names, or run `make _HIDE= <target>` to expose
#                 everything for debugging.
#
# Derived variables (prefixed with $(_HIDE)):
#   SEMVER_VERSION, SEMVER_MAJOR, SEMVER_MINOR, SEMVER_PATCH,
#   SEMVER_PRERELEASE, SEMVER_BUILDMETA, SEMVER_VALID
#   BUILD_DATE, BUILD_DATE_SEMVER, BUILD_DATE_TZ
#   BUILD_VCS_URL, BUILD_VCS_ID, BUILD_VCS_ID_FULL, BUILD_VCS_ID_DATE,
#   BUILD_VCS_BRANCH
#
# An unresolvable or malformed version soft-fails to 0.0.0-unknown and
# leaves SEMVER_VALID empty. Repos wanting a hard failure test the flag:
#   check-version:
#   	$(if $($(_HIDE)SEMVER_VALID),,$(error VERSION is unusable))
#
# Recipes: dump.version prints everything above; if the including Makefile
# defines dump.version.extra, its lines are appended to the dump.

_HIDE ?= _

# ── Version ───────────────────────────────────────────────────
# Default source: nearest tag, 'v' stripped, patch+1 ("next release").
# Only plain x.y.z tags qualify; a prerelease/buildmeta tag produces no
# output and falls through to 0.0.0-unknown — set VERSION or VERSION_CMD
# for anything richer.
VERSION_CMD ?= git describe --tags --abbrev=0 2>/dev/null | sed -e 's/^v//' | awk -F. 'NF==3 && $$3 ~ /^[0-9]+$$/ {print $$1"."$$2"."$$3+1}'

# Lazy (=/?=) rather than immediate (:=) so consumers re-evaluate at recipe
# execution time. Important for chains like `make bump dev build ...` where
# `bump` edits the version source at recipe time — if these were :=, they'd
# capture the pre-bump value at parse time and the build would stamp the
# wrong version. Preserves the two interfaces: VERSION is user-settable
# input; SEMVER_* are the internal canonical values derived from it.
VERSION ?= $(shell v=$$($(VERSION_CMD)); echo "$${v:-0.0.0-unknown}")

# Strip leading 'v' for parsing; remember it so SEMVER_VERSION reassembles
# byte-identical to the input.
$(_HIDE)SEMVER_IN     = $(patsubst v%,%,$(VERSION))
$(_HIDE)SEMVER_PREFIX = $(if $(filter v%,$(VERSION)),v,)

# Split buildmeta off first (everything after '+'), then prerelease
# (everything after the first '-' of what remains), leaving the x.y.z core.
$(_HIDE)SEMVER_NOMETA  = $(firstword $(subst +, ,$($(_HIDE)SEMVER_IN)))
$(_HIDE)SEMVER_CORE    = $(firstword $(subst -, ,$($(_HIDE)SEMVER_NOMETA)))
$(_HIDE)SEMVER_PRE_RAW = $(patsubst $($(_HIDE)SEMVER_CORE)-%,%,$($(_HIDE)SEMVER_NOMETA))

# Parts are ?= so the command line (or the including Makefile) can override
# any of them individually; unset ones derive from VERSION.
$(_HIDE)SEMVER_MAJOR      ?= $(word 1,$(subst ., ,$($(_HIDE)SEMVER_CORE)))
$(_HIDE)SEMVER_MINOR      ?= $(word 2,$(subst ., ,$($(_HIDE)SEMVER_CORE)))
$(_HIDE)SEMVER_PATCH      ?= $(word 3,$(subst ., ,$($(_HIDE)SEMVER_CORE)))
$(_HIDE)SEMVER_PRERELEASE ?= $(if $(filter-out $($(_HIDE)SEMVER_NOMETA),$($(_HIDE)SEMVER_PRE_RAW)),$($(_HIDE)SEMVER_PRE_RAW),)
$(_HIDE)SEMVER_BUILDMETA  ?= $(word 2,$(subst +, ,$($(_HIDE)SEMVER_IN)))

# Reassembled from the parts (lazy) so part overrides — including
# target-specific ones like `build: $(_HIDE)SEMVER_PRERELEASE := dev` —
# flow into everything downstream.
$(_HIDE)SEMVER_VERSION = $($(_HIDE)SEMVER_PREFIX)$($(_HIDE)SEMVER_MAJOR).$($(_HIDE)SEMVER_MINOR).$($(_HIDE)SEMVER_PATCH)$(if $($(_HIDE)SEMVER_PRERELEASE),-$($(_HIDE)SEMVER_PRERELEASE))$(if $($(_HIDE)SEMVER_BUILDMETA),+$($(_HIDE)SEMVER_BUILDMETA))

# Soft validation flag: 'yes' when major.minor.patch are present and
# numeric and the version isn't the 0.0.0-unknown fallback; empty otherwise.
$(_HIDE)SEMVER_VALID = $(if $(filter 0.0.0-unknown,$($(_HIDE)SEMVER_IN)),,$(if $(and $($(_HIDE)SEMVER_MAJOR),$($(_HIDE)SEMVER_MINOR),$($(_HIDE)SEMVER_PATCH)),$(if $(shell echo "$($(_HIDE)SEMVER_MAJOR).$($(_HIDE)SEMVER_MINOR).$($(_HIDE)SEMVER_PATCH)" | tr -d '0-9.'),,yes),))

# ── Build metadata ────────────────────────────────────────────
# BUILD_DATE is canonical zulu; BUILD_DATE_SEMVER is the same instant in a
# colon-free form legal inside semver build-metadata identifiers;
# BUILD_DATE_TZ carries the builder-local (or BUILD_TZ-forced) time.
BUILD_TZ ?= local
$(_HIDE)BUILD_DATE        := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
$(_HIDE)BUILD_DATE_SEMVER := $(shell date -u +"%Y%m%dT%H%M%SZ")
$(_HIDE)BUILD_DATE_TZ     := $(shell $(if $(filter local,$(BUILD_TZ)),,TZ='$(BUILD_TZ)' )date +"%Y-%m-%dT%H:%M:%S%z")
$(_HIDE)BUILD_VCS_URL     := $(shell git remote get-url origin 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID_FULL := $(shell git rev-parse HEAD 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID_DATE := $(shell TZ=UTC0 git log -1 --date=format-local:"%Y-%m-%dT%H:%M:%SZ" --format=%cd 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_BRANCH  := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# ── Dump action ──────────────────────────────────────────────
define dump.version
	@echo "VERSION           $(VERSION)"
	@echo "SEMVER_VERSION    $($(_HIDE)SEMVER_VERSION)"
	@echo "SEMVER_MAJOR      $($(_HIDE)SEMVER_MAJOR)"
	@echo "SEMVER_MINOR      $($(_HIDE)SEMVER_MINOR)"
	@echo "SEMVER_PATCH      $($(_HIDE)SEMVER_PATCH)"
	@echo "SEMVER_PRERELEASE $($(_HIDE)SEMVER_PRERELEASE)"
	@echo "SEMVER_BUILDMETA  $($(_HIDE)SEMVER_BUILDMETA)"
	@echo "SEMVER_VALID      $($(_HIDE)SEMVER_VALID)"
	@echo "BUILD_DATE        $($(_HIDE)BUILD_DATE)"
	@echo "BUILD_DATE_SEMVER $($(_HIDE)BUILD_DATE_SEMVER)"
	@echo "BUILD_DATE_TZ     $($(_HIDE)BUILD_DATE_TZ)"
	@echo "BUILD_VCS_URL     $($(_HIDE)BUILD_VCS_URL)"
	@echo "BUILD_VCS_ID      $($(_HIDE)BUILD_VCS_ID)"
	@echo "BUILD_VCS_ID_DATE $($(_HIDE)BUILD_VCS_ID_DATE)"
	$(dump.version.extra)
endef
