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
$(_HIDE)FLAG_version     := $($(_HIDE)WANT_VERSION)
$(_HIDE)FLAG_actions     := $($(_HIDE)WANT_ACTIONS)
$(_HIDE)FLAG_lint        := $($(_HIDE)WANT_LINT)
$(_HIDE)FLAG_gate        := $($(_HIDE)WANT_GATE)
$(_HIDE)FLAG_tests       := $($(_HIDE)WANT_TESTS)
$(_HIDE)FLAG_coverage    := $($(_HIDE)WANT_COVERAGE)
$(_HIDE)FLAG_summary     := $($(_HIDE)WANT_SUMMARY)
$(_HIDE)FLAG_dependabot  := $($(_HIDE)WANT_DEPENDABOT)

# Known modifiers — the set checked during validation in declare_verb
$(_HIDE)KNOWN_MODS := frontend backend cf github e2e dist version actions lint gate tests coverage summary dependabot

# Known verbs — populated by declare_verb, checked for collisions
$(_HIDE)KNOWN_VERBS :=

# ── register(verb,modifier,[prereqs]) ───────────────────────
# Generates hidden target via $(eval). The $(_HIDE) prefix on
# generated target names hides them from tab completion.
define $(_HIDE)register_impl
.PHONY: $(_HIDE)$1.$2
$(_HIDE)$1.$2: $3
	$$($1.$2)
$(_HIDE)DEPS_$1 += $$(if $$($(_HIDE)FLAG_$2),$(_HIDE)$1.$2)
$(_HIDE)VALID_MODS_$1 += $2
$(_HIDE)ALL_MODS += $2
$(_HIDE)REGISTRY += $1.$2
endef

register = $(if $(filter $(strip $2),$($(_HIDE)KNOWN_VERBS)),$(warning COLLISION: modifier '$(strip $2)' in 'register($(strip $1),$(strip $2))' is also a declared verb — 'make $(strip $1) $(strip $2)' will run both))$(eval $(call $(_HIDE)register_impl,$(strip $1),$(strip $2),$(strip $3)))

# ── register_always(verb,modifier,[prereqs]) ─────────────────
# Like register, but the target is always created (no flag check)
# and the modifier is NOT added to VALID_MODS or REGISTRY.
# Use for targets with custom wiring (e.g., clean.release, dump.version).
# If the modifier is flag-gated, pair with allow() to suppress warnings.
define $(_HIDE)register_always_impl
.PHONY: $(_HIDE)$1.$2
$(_HIDE)$1.$2: $3
	$$($1.$2)
endef

register_always = $(eval $(call $(_HIDE)register_always_impl,$(strip $1),$(strip $2),$(strip $3)))

# ── allow(verb,modifier) ─────────────────────────────────────
# Mark a modifier as valid for a verb without creating a recipe.
# Use when the modifier affects behavior through variables rather
# than adding a distinct target (e.g., cf forces linux/amd64 for build).
allow = $(eval $(_HIDE)VALID_MODS_$(strip $1) += $(strip $2))

# ── Modifier validation ──────────────────────────────────────
# Called inside declare_verb and declare_verb_default. Emits a
# parse-time warning for each active modifier not registered or
# allowed for this verb.
$(_HIDE)check_mods = $(if $(filter $1,$(MAKECMDGOALS)),$(foreach mod,$($(_HIDE)KNOWN_MODS),$(if $(and $($(_HIDE)FLAG_$(mod)),$(if $(filter $(mod),$($(_HIDE)VALID_MODS_$1)),,x)),$(warning WARNING: 'make $1 $(mod)' — '$(mod)' is not a valid modifier for '$1' (ignored)))))

# ── declare_verb(verb) ──────────────────────────────────────
define $(_HIDE)declare_verb_impl
.PHONY: $1
$1: $$($(_HIDE)DEPS_$1)
endef

declare_verb = $(if $(filter $(strip $1),$($(_HIDE)KNOWN_MODS) $($(_HIDE)ALL_MODS)),$(warning COLLISION: verb '$(strip $1)' in 'declare_verb($(strip $1))' is also a registered modifier — 'make <verb> $(strip $1)' will conflict))$(eval $(_HIDE)KNOWN_VERBS += $(strip $1))$(call $(_HIDE)check_mods,$(strip $1))$(eval $(call $(_HIDE)declare_verb_impl,$(strip $1)))

# ── declare_verb_default(verb,default_dep) ──────────────────
# Like declare_verb, but runs default_dep when no flag-gated deps
# are active. Use for verbs like clean where the bare invocation
# should have a sensible default action.
define $(_HIDE)declare_verb_default_impl
.PHONY: $1
$1: $$($(_HIDE)DEPS_$1) $$(if $$(strip $$($(_HIDE)DEPS_$1)),,$(strip $2))
endef

declare_verb_default = $(if $(filter $(strip $1),$($(_HIDE)KNOWN_MODS) $($(_HIDE)ALL_MODS)),$(warning COLLISION: verb '$(strip $1)' in 'declare_verb_default($(strip $1))' is also a registered modifier — 'make <verb> $(strip $1)' will conflict))$(eval $(_HIDE)KNOWN_VERBS += $(strip $1))$(call $(_HIDE)check_mods,$(strip $1))$(eval $(call $(_HIDE)declare_verb_default_impl,$(strip $1),$(strip $2)))
