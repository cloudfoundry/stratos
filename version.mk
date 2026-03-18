# version.mk — shared semver resolution
#
# Reads VERSION from package.json (or environment override), then exposes:
#   SEMVER_VERSION, SEMVER_MAJOR, SEMVER_MINOR, SEMVER_PATCH,
#   SEMVER_PRERELEASE, SEMVER_BUILDMETA
#   BUILD_DATE, BUILD_VCS_URL, BUILD_VCS_ID, BUILD_VCS_ID_DATE

# ── Version ───────────────────────────────────────────────────
VERSION       ?= $(shell node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0-unknown")
SEMVER_VERSION := $(VERSION)

# Strip leading 'v' for parsing
_V := $(patsubst v%,%,$(SEMVER_VERSION))

# Split on '-' to separate core from prerelease+buildmeta
_CORE       := $(firstword $(subst -, ,$(_V)))
_PRE_BUILD  := $(word 2,$(subst -, ,$(_V)))

SEMVER_MAJOR      := $(word 1,$(subst ., ,$(_CORE)))
SEMVER_MINOR      := $(word 2,$(subst ., ,$(_CORE)))
SEMVER_PATCH      := $(word 3,$(subst ., ,$(_CORE)))

# Prerelease: everything after first '-', before any '+'
SEMVER_PRERELEASE := $(firstword $(subst +, ,$(patsubst $(_CORE)-%,%,$(_V))))
ifeq ($(SEMVER_PRERELEASE),$(_V))
  SEMVER_PRERELEASE :=
endif

# Build metadata: everything after '+'
SEMVER_BUILDMETA  := $(word 2,$(subst +, ,$(_V)))

# ── Build metadata ────────────────────────────────────────────
BUILD_DATE        := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_VCS_URL     := $(shell git remote get-url origin 2>/dev/null || echo "unknown")
BUILD_VCS_ID      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_VCS_ID_FULL := $(shell git rev-parse HEAD 2>/dev/null || echo "unknown")
BUILD_VCS_ID_DATE := $(shell git log -1 --format=%cI 2>/dev/null || echo "unknown")
BUILD_VCS_BRANCH  := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# ── Go ldflags ────────────────────────────────────────────────
GO_LDFLAGS := -X main.appVersion=$(SEMVER_VERSION) -X main.buildDate=$(BUILD_DATE) -X main.gitCommit=$(BUILD_VCS_ID) -X main.gitBranch=$(BUILD_VCS_BRANCH)

# ── Frontend build info ──────────────────────────────────────
BUILD_INFO_TS := src/frontend/packages/core/src/environments/build-info.ts

.PHONY: fe-version
fe-version:
	@mkdir -p $(dir $(BUILD_INFO_TS))
	@printf "export const BUILD_INFO = {\n  version: '%s',\n  gitCommit: '%s',\n  gitBranch: '%s',\n  buildDate: '%s',\n};\n" \
		"$(SEMVER_VERSION)" "$(BUILD_VCS_ID)" "$(BUILD_VCS_BRANCH)" "$(BUILD_DATE)" \
		> $(BUILD_INFO_TS)
	@echo "Generated $(BUILD_INFO_TS)"

# ── Introspection ─────────────────────────────────────────────
.PHONY: dump dump-version
dump: dump-version
dump-version:
	@echo "SEMVER_VERSION    $(SEMVER_VERSION)"
	@echo "SEMVER_MAJOR      $(SEMVER_MAJOR)"
	@echo "SEMVER_MINOR      $(SEMVER_MINOR)"
	@echo "SEMVER_PATCH      $(SEMVER_PATCH)"
	@echo "SEMVER_PRERELEASE $(SEMVER_PRERELEASE)"
	@echo "SEMVER_BUILDMETA  $(SEMVER_BUILDMETA)"
	@echo "BUILD_DATE        $(BUILD_DATE)"
	@echo "BUILD_VCS_URL     $(BUILD_VCS_URL)"
	@echo "BUILD_VCS_ID      $(BUILD_VCS_ID)"
	@echo "BUILD_VCS_ID_DATE $(BUILD_VCS_ID_DATE)"
	@echo "GO_LDFLAGS        $(GO_LDFLAGS)"
