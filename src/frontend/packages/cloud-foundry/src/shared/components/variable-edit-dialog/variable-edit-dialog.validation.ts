/**
 * Pure validation helpers for the Variables-tab edit dialog.
 *
 * Two-tier name validation (Norm 2026-06-04):
 *  - HARD errors block Save — things CF actually rejects, or a key collision.
 *    CF's real rules (cloud_controller_ng EnvironmentVariablesStringValuesValidator):
 *    non-empty, must not start with VCAP_/VMC_ (case-insensitive), must not be PORT.
 *  - WARNINGS allow Save — the stricter shell-safe pattern CF does NOT enforce,
 *    kept as a deliberate UX nudge.
 *
 * Values are always stored/sent as strings; "JSON mode" is only an editing
 * affordance, so invalid JSON warns but never blocks (CF accepts any string).
 */

export interface NameValidation {
  /** Non-null = Save is blocked. */
  hardError: string | null;
  /** Non-null = advisory only; Save still allowed. */
  warning: string | null;
}

/** Shell-variable convention: start with a letter/underscore, then
 *  letters/digits/underscores. Stricter than CF — used only for the warning. */
const SHELL_SAFE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Validate an environment-variable name. `existingNames` is the set the new
 * name must NOT collide with — the caller pre-excludes the row's own name
 * when editing, so an unchanged name in edit mode passes.
 */
export function validateVariableName(name: string, existingNames: readonly string[]): NameValidation {
  const n = name.trim();

  if (!n) {
    return { hardError: 'Name is required', warning: null };
  }
  if (/^(VCAP_|VMC_)/i.test(n)) {
    return { hardError: "Name cannot start with 'VCAP_' or 'VMC_'", warning: null };
  }
  if (n === 'PORT') {
    return { hardError: "'PORT' is a reserved name", warning: null };
  }
  if (existingNames.includes(n)) {
    return { hardError: `'${n}' is already in use`, warning: null };
  }
  if (!SHELL_SAFE_PATTERN.test(n)) {
    return {
      hardError: null,
      warning: 'Not a valid shell variable name (letters, digits, underscores; cannot start with a digit). CF will accept it.',
    };
  }
  return { hardError: null, warning: null };
}

/**
 * Whether a value should default to JSON editing mode: only object/array
 * text that actually parses. A bare string/number is technically valid JSON
 * but the user almost never means "JSON" by it, so it stays plain.
 */
export function looksLikeJson(value: string): boolean {
  const t = value.trim();
  if (!t || !/^[{[]/.test(t)) {
    return false;
  }
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

/**
 * Advisory warning for JSON mode: returns a message when the text is not
 * valid JSON, or null when it is valid (or empty — no nagging on empty).
 * Never blocks Save.
 */
export function jsonModeWarning(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'Value is not valid JSON. It will be saved as-is.';
  }
}
