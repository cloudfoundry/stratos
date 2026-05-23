/**
 * Shared Intl.Collator instances for natural (human-friendly) string sort.
 *
 * `numeric: true` makes "app-2" < "app-10" (digit runs compared by value).
 * `sensitivity: 'base'`  — case- AND accent-insensitive (default).
 * `sensitivity: 'variant'` — case- AND accent-sensitive (the toggled mode).
 *
 * Two collators rather than one parameterized at call time so the runtime
 * config stays inside the closed-over instance and the comparator stays
 * tight (Array.sort fires its comparator N log N times).
 */
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const naturalCollatorCaseSensitive = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'variant',
});

/**
 * Drop-in replacement for localeCompare with natural sort semantics.
 * Default policy: case-insensitive. Pass `caseSensitive=true` to opt into
 * the per-list match-case toggle.
 */
export function naturalCompare(a: string, b: string, caseSensitive = false): number {
  const collator = caseSensitive ? naturalCollatorCaseSensitive : naturalCollator;
  return collator.compare(a ?? '', b ?? '');
}
