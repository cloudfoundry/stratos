# actions.mk — dynamic target generation for verb+modifier pattern
#
# Usage — define a recipe block, then register it:
#
#   define build.frontend
#   	@echo "Building frontend..."
#   	bun run build
#   endef
#   $(call register,build,frontend)
#
# With prerequisites:
#   $(call register,build,frontend,$(_HIDE)stamp.frontend)
#
# Then declare the verb to wire everything up:
#   $(call declare_verb,build)

# ── Modifier-to-flag mapping ────────────────────────────────
$(_HIDE)FLAG_frontend    := $($(_HIDE)WANT_FRONTEND)
$(_HIDE)FLAG_backend     := $($(_HIDE)WANT_BACKEND)
$(_HIDE)FLAG_cf          := $($(_HIDE)WANT_CF)
$(_HIDE)FLAG_github      := $($(_HIDE)WANT_GITHUB)
$(_HIDE)FLAG_e2e         := $($(_HIDE)WANT_E2E)
$(_HIDE)FLAG_dist        := $($(_HIDE)WANT_CLEAN_DIST)

# ── register(verb,modifier,[prereqs]) ───────────────────────
# Generates hidden target via $(eval). The $(_HIDE) prefix on
# generated target names hides them from tab completion.
define $(_HIDE)register_impl
.PHONY: $(_HIDE)$1.$2
$(_HIDE)$1.$2: $3
	$$($1.$2)
$(_HIDE)DEPS_$1 += $$(if $$($(_HIDE)FLAG_$2),$(_HIDE)$1.$2)
endef

register = $(eval $(call $(_HIDE)register_impl,$(strip $1),$(strip $2),$(strip $3)))

# ── register_always(verb,modifier,[prereqs]) ─────────────────
# Like register, but the target is always created (no flag check).
# Use for targets with custom wiring (e.g., clean.release, dump.version).
define $(_HIDE)register_always_impl
.PHONY: $(_HIDE)$1.$2
$(_HIDE)$1.$2: $3
	$$($1.$2)
endef

register_always = $(eval $(call $(_HIDE)register_always_impl,$(strip $1),$(strip $2),$(strip $3)))

# ── declare_verb(verb) ──────────────────────────────────────
define $(_HIDE)declare_verb_impl
.PHONY: $1
$1: $$($(_HIDE)DEPS_$1)
endef

declare_verb = $(eval $(call $(_HIDE)declare_verb_impl,$(strip $1)))
