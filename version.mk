# version.mk — shared semver resolution and build metadata
#
# Public variables (user-settable):
#   VERSION            Override version from package.json
#
# Hidden variables (internal, toggle with: make _HIDE= ...):
#   SEMVER_VERSION, SEMVER_MAJOR, SEMVER_MINOR, SEMVER_PATCH,
#   SEMVER_PRERELEASE, SEMVER_BUILDMETA
#   BUILD_DATE, BUILD_VCS_URL, BUILD_VCS_ID, BUILD_VCS_ID_DATE
#   GO_LDFLAGS, BUILD_INFO_TS

# ── Hidden prefix ────────────────────────────────────────────
# Prefixes internal names with _ to hide from tab completion.
# Debug mode: make _HIDE= <target>  (exposes all variables)
_HIDE := _

# ── Version ───────────────────────────────────────────────────
VERSION       ?= $(shell node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0-unknown")
$(_HIDE)SEMVER_VERSION := $(VERSION)

# Strip leading 'v' for parsing
$(_HIDE)V := $(patsubst v%,%,$($(_HIDE)SEMVER_VERSION))

# Split on '-' to separate core from prerelease+buildmeta
$(_HIDE)CORE       := $(firstword $(subst -, ,$($(_HIDE)V)))
$(_HIDE)PRE_BUILD  := $(word 2,$(subst -, ,$($(_HIDE)V)))

$(_HIDE)SEMVER_MAJOR      := $(word 1,$(subst ., ,$($(_HIDE)CORE)))
$(_HIDE)SEMVER_MINOR      := $(word 2,$(subst ., ,$($(_HIDE)CORE)))
$(_HIDE)SEMVER_PATCH      := $(word 3,$(subst ., ,$($(_HIDE)CORE)))

# Prerelease: everything after first '-', before any '+'
$(_HIDE)SEMVER_PRERELEASE := $(firstword $(subst +, ,$(patsubst $($(_HIDE)CORE)-%,%,$($(_HIDE)V))))
ifeq ($($(_HIDE)SEMVER_PRERELEASE),$($(_HIDE)V))
  $(_HIDE)SEMVER_PRERELEASE :=
endif

# Build metadata: everything after '+'
$(_HIDE)SEMVER_BUILDMETA  := $(word 2,$(subst +, ,$($(_HIDE)V)))

# ── Build metadata ────────────────────────────────────────────
$(_HIDE)BUILD_DATE        := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
$(_HIDE)BUILD_VCS_URL     := $(shell git remote get-url origin 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID_FULL := $(shell git rev-parse HEAD 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_ID_DATE := $(shell git log -1 --format=%cI 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_VCS_BRANCH  := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_NODE_VERSION := $(shell node --version 2>/dev/null || echo "unknown")
$(_HIDE)BUILD_TS_VERSION   := $(shell npx tsc --version 2>/dev/null | awk '{print $$2}' || echo "unknown")
$(_HIDE)BUILD_BUN_VERSION  := $(shell bun --version 2>/dev/null || echo "unknown")

# ── Go ldflags ────────────────────────────────────────────────
$(_HIDE)GO_LDFLAGS := -X main.appVersion=$($(_HIDE)SEMVER_VERSION) -X main.buildDate=$($(_HIDE)BUILD_DATE) -X main.gitCommit=$($(_HIDE)BUILD_VCS_ID) -X main.gitBranch=$($(_HIDE)BUILD_VCS_BRANCH)

# ── Frontend build info path ─────────────────────────────────
$(_HIDE)BUILD_INFO_TS := src/frontend/packages/core/src/environments/build-info.ts

# ── Stamp action ─────────────────────────────────────────────
define stamp.frontend
	@mkdir -p $(dir $($(_HIDE)BUILD_INFO_TS))
	@printf "export const BUILD_INFO = {\n  version: '%s',\n  gitProject: '%s',\n  gitCommit: '%s',\n  gitBranch: '%s',\n  buildDate: '%s',\n  nodeVersion: '%s',\n  typescriptVersion: '%s',\n  bunVersion: '%s',\n};\n" \
		"$($(_HIDE)SEMVER_VERSION)" "$($(_HIDE)BUILD_VCS_URL)" "$($(_HIDE)BUILD_VCS_ID)" "$($(_HIDE)BUILD_VCS_BRANCH)" "$($(_HIDE)BUILD_DATE)" \
		"$($(_HIDE)BUILD_NODE_VERSION)" "$($(_HIDE)BUILD_TS_VERSION)" "$($(_HIDE)BUILD_BUN_VERSION)" \
		> $($(_HIDE)BUILD_INFO_TS)
	@echo "Generated $($(_HIDE)BUILD_INFO_TS)"
endef

# ── Dump action ──────────────────────────────────────────────
define dump.version
	@echo "SEMVER_VERSION    $($(_HIDE)SEMVER_VERSION)"
	@echo "SEMVER_MAJOR      $($(_HIDE)SEMVER_MAJOR)"
	@echo "SEMVER_MINOR      $($(_HIDE)SEMVER_MINOR)"
	@echo "SEMVER_PATCH      $($(_HIDE)SEMVER_PATCH)"
	@echo "SEMVER_PRERELEASE $($(_HIDE)SEMVER_PRERELEASE)"
	@echo "SEMVER_BUILDMETA  $($(_HIDE)SEMVER_BUILDMETA)"
	@echo "BUILD_DATE        $($(_HIDE)BUILD_DATE)"
	@echo "BUILD_VCS_URL     $($(_HIDE)BUILD_VCS_URL)"
	@echo "BUILD_VCS_ID      $($(_HIDE)BUILD_VCS_ID)"
	@echo "BUILD_VCS_ID_DATE $($(_HIDE)BUILD_VCS_ID_DATE)"
	@echo "GO_LDFLAGS        $($(_HIDE)GO_LDFLAGS)"
endef
