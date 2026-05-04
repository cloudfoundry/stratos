import { Signal, computed } from '@angular/core';

export interface SortSpec<T = unknown> {
  // Property name on T to sort by. Declared as string (not keyof T) so
  // the shape is compatible with SignalListComponent's SignalListSort
  // without an explicit cast at the boundary.
  field: string;
  direction: 'asc' | 'desc';
  // Keep the generic so existing callers that parameterize SortSpec<StApp>
  // continue to type-check.
  _phantom?: T;
}

export class ViewPipeline<T> {
  readonly filteredItems: Signal<T[]>;
  readonly sortedItems: Signal<T[]>;
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    private readonly items: Signal<T[]>,
    private readonly filter: Signal<(row: T) => boolean>,
    private readonly sort: Signal<SortSpec<T>>,
    private readonly pageSize: Signal<number>,
    private readonly pageIndex: Signal<number>,
    // Optional lookup: sort-field key → value-extractor function. When the
    // sort spec's `field` matches a key here, the extractor is used to
    // derive the comparison value (e.g., a column rendered from multiple
    // entity properties). Falls back to `row[field]` when no extractor is
    // registered. Signal so extractors can be rebuilt reactively if column
    // definitions change.
    private readonly keyExtractors?: Signal<Map<string, (row: T) => unknown>>,
  ) {
    this.filteredItems = computed(() => this.items().filter(this.filter()));
    this.sortedItems = computed(() => {
      const spec = this.sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const extractor = this.keyExtractors?.().get(spec.field);
      const getValue: (row: T) => unknown = extractor
        ? extractor
        : (row: T) => (row as Record<string, unknown>)[spec.field];
      return [...this.filteredItems()].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        // Prefer numeric comparison when both sides are numbers — prevents
        // accidental string coercion when, e.g., a number column gets a
        // stringified value from a legacy backend path. Fall back to the
        // generic `<` / `>` operators for string / date / other types.
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * sign;
        }
        return av < bv ? -1 * sign : av > bv ? 1 * sign : 0;
      });
    });
    this.pagedItems = computed(() => {
      const size = this.pageSize();
      const start = this.pageIndex() * size;
      return this.sortedItems().slice(start, start + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => Math.ceil(this.totalFilteredResults() / this.pageSize()));
  }
}
