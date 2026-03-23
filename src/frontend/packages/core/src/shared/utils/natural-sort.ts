/**
 * Shared Intl.Collator for natural (human-friendly) string sorting.
 * numeric: true  -- "app-2" < "app-10"
 * sensitivity: 'base' -- case-insensitive, accent-insensitive
 */
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/**
 * Drop-in replacement for localeCompare with natural sort semantics.
 * Usage: array.sort((a, b) => naturalCompare(a.name, b.name))
 */
export function naturalCompare(a: string, b: string): number {
  return naturalCollator.compare(a ?? '', b ?? '');
}
