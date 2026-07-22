// Page size sentinels — negative values that represent computed sizes.
// Add new sentinels here; resolvePageSize() and getPageSizeLabel() handle the rest.
export const PAGE_SIZE_ALL = -1;

export interface PageSizeSentinel {
  value: number;
  label: string;
  resolve: (totalItems: number) => number;
}

const PAGE_SIZE_SENTINELS: PageSizeSentinel[] = [
  { value: PAGE_SIZE_ALL, label: 'All', resolve: (total) => total || 1 },
];

/** Returns true if the value is a sentinel (negative) rather than a literal page size. */
export function isPageSizeSentinel(value: number): boolean {
  return PAGE_SIZE_SENTINELS.some(s => s.value === value);
}

/** Resolve a sentinel to an effective page size, or return the value unchanged. */
export function resolvePageSize(value: number, totalItems: number): number {
  const sentinel = PAGE_SIZE_SENTINELS.find(s => s.value === value);
  return sentinel ? sentinel.resolve(totalItems) : value;
}

/** Display label for a page size option. Returns the number as string for non-sentinels. */
export function getPageSizeLabel(value: number): string {
  const sentinel = PAGE_SIZE_SENTINELS.find(s => s.value === value);
  return sentinel ? sentinel.label : String(value);
}

export const defaultPaginationPageSizeOptionsCards = [6, 12, 24, 48, 96, PAGE_SIZE_ALL];
export const defaultPaginationPageSizeOptionsTable = [10, 25, 50, 100, PAGE_SIZE_ALL];
