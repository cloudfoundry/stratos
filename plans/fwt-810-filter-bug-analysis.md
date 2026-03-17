# FWT-810: Filter Not Applied — Root Cause Analysis

## Symptom

Typing a filter string (e.g., "cf-") in the list filter input shows the text in the
input with the X clear button (FWT-810 feature working), but the list is NOT filtered.
All items remain visible and the item count stays at the unfiltered total.

## Investigation Summary

Traced the full data path from input → store → LocalListController → page$ → template:

1. **Input → Store**: `@ViewChild('filter')` → `valueChanges` → `debounceTime(150)` →
   `filterByString()` → `SetClientFilter` dispatch → reducer updates
   `clientPagination.filter.string`. ✅ Works correctly.

2. **Store → LocalListController**: `pagination$` selector emits → `cleanPagination$`
   detects filter change via `getPaginationCompareString` → `combineLatest` re-fires →
   `dataFunctions` apply filter → filtered entities emitted. ✅ Works correctly
   (verified by unit tests).

3. **LocalListController → page$**: Filtered entities flow through `splitCurrentPage` →
   `shareReplay({ bufferSize: 1, refCount: true })`. ✅ Works correctly.

4. **page$ → Template**: This is where the bug lives. Two issues:

### Root Cause 1: Stacked `publishReplay(1), refCount()` blocks filtered emissions

```typescript
// list-data-source.ts (before fix)
this.page$ = page$.pipe(
  withLatestFrom(this.isLoadingPage$.pipe(startWith(false))),
  filter(([page, isLoading]) => !isLoading),
  map(([page]) => page),
  publishReplay(1),   // <-- stale replay
  refCount()
);
```

For local lists, `page$` from `LocalListController` already uses
`shareReplay({ bufferSize: 1, refCount: true })`. Adding another
`publishReplay(1), refCount()` on top creates two problems:

1. **`isLoadingPage$` gate blocks filtered emissions**: `isLoadingPage$` uses
   `observeOn(asapScheduler)` which delays its emissions. When LocalListController
   emits filtered results synchronously, `withLatestFrom` samples a stale `true`
   from `isLoadingPage$` and blocks the filtered page. The count updates correctly
   (via `setResultCount` called before the page emission) but the table never
   receives the filtered data.

2. **Stacked replay causes stale data**: Even without the loading gate, the outer
   `publishReplay(1)` replays stale unfiltered data during subscriber churn caused
   by `connect()` creating new observable references and the async pipe
   re-subscribing.

### Root Cause 2: Missing `markForCheck()` in manual subscriptions

With `provideZonelessChangeDetection()` + `ChangeDetectionStrategy.OnPush`, setting
component properties in `tap()` callbacks does **not** trigger change detection:

```typescript
// paginationStoreToWidget — updates paginatorSettings but no CD triggered
const paginationStoreToWidget = this.paginationController.pagination$.pipe(
  tap((pagination) => {
    this.paginatorSettings.length = pagination.totalResults;  // invisible to Angular
    this.paginatorSettings.pageIndex = pagination.pageIndex - 1;
    this.paginatorSettings.pageSize = pagination.pageSize;
  })
);

// filterStoreToWidget — updates filterString but no CD triggered
const filterStoreToWidget = this.paginationController.filter$.pipe(
  tap((paginationFilter) => {
    this.filterString = paginationFilter.string;  // invisible to Angular
    // ... multiFilterManager updates ...
  })
);
```

Result: the item count display (`1 - 15 of 15`) and filter-dependent template bindings
never update because Angular never re-checks the list component's template.

### Root Cause 3: Table `@for` uses `track $index` causing stale row rendering

```html
<!-- table.component.html (before fix) -->
@for (row of dataSource.connect(null) | async; track $index; let i = $index) {
```

When filtered data changes the entity at a given array index, Angular's `@for` with
`track $index` reuses the existing DOM node at that index without updating its bindings.
This caused the table to display stale row content (e.g., showing "console490" when
"openproject" was the actual match for filter "open").

Switching to card view and back forced a full re-render which displayed correct data,
confirming this was a DOM reuse issue rather than a data issue.

## Fixes Applied

### Fix 1: Remove `publishReplay`/`refCount`/`isLoadingPage$` for local lists (list-data-source.ts)

```typescript
// For local lists, use the controller's page$ directly
this.page$ = this.isLocal ? page$ : page$.pipe(
  withLatestFrom(this.isLoadingPage$.pipe(startWith(false))),
  filter(([page, isLoading]) => !isLoading),
  map(([page]) => page),
  publishReplay(1),
  refCount()
);
```

Local lists use `LocalListController.page$` directly — it already has
`shareReplay({ bufferSize: 1, refCount: true })` for multicasting. No loading gate
needed since data is already loaded client-side.

### Fix 2: Cache `connect()` observable (list-data-source.ts)

```typescript
private _connectObs: Observable<T[]>;
connect(): Observable<T[]> {
  if (!this._connectObs) {
    this._connectObs = this.page$.pipe(tag('actual-page-obs'));
  }
  return this._connectObs;
}
```

Same reference returned every call → async pipe stays subscribed instead of
re-subscribing on every change detection cycle.

### Fix 3: Add `markForCheck()` to manual subscriptions (list.component.ts)

Added `this.cd.markForCheck()` to:
- `paginationStoreToWidget` tap (after updating paginatorSettings)
- `filterStoreToWidget` tap (after updating filterString and multiFilterManagers)

This ensures zoneless Angular schedules a CD cycle when these properties change.

### Fix 4: Use entity ID tracking instead of index (table.component.html)

```html
<!-- Before -->
@for (row of dataSource.connect(null) | async; track $index; let i = $index) {

<!-- After -->
@for (row of dataSource.connect(null) | async; track dataSource.trackBy(i, row); let i = $index) {
```

`trackBy` returns the entity's unique ID (guid). When filtered data changes which
entity is at index 0, Angular now recognizes it as a different entity and fully
re-renders the row instead of reusing the old DOM node.

## Tests Added

### Unit Tests

**list.component.spec.ts** (8 new tests):
- `clearFilterText()`: clears filterString and calls filterByString
- `clearFilterText()`: works when already empty
- `getVisibleStart()`/`getVisibleEnd()`: first page, second page, last page, empty,
  "All" page size
- `showScrollShadow`: initial false, overflow true, scrolled-to-bottom false, no-overflow
  false, threshold boundary (>4px), threshold boundary (≤4px)

**local-list-controller.spec.ts** (6 new tests):
- Full pipeline: filter applies correctly (BehaviorSubject → LocalListController → 5/15 match)
- Result count updated after filtering
- Empty ids returns empty page
- Filter clear restores all entities
- Full data source pipeline with persistent subscription (publishReplay + isLoading)
- isLoading blocking test: stale value replayed when loading blocks emission

### E2E Tests

**list-filter.spec.ts** (10 new tests):

*Table View (4 tests):*
- Filters rows and verifies each displayed name contains the filter string
- Updates displayed rows when filter changes (no stale data)
- Shows empty state when filter matches nothing
- Restores all rows when filter is cleared

*Card View (3 tests):*
- Filters cards and count matches card count
- Updates cards when filter changes
- Restores cards when Escape key pressed

*Cross-View Filter (3 tests):*
- Filter persists table → card with correct count
- Filter persists card → table with correct rows matching filter string

## Additional Fixes (discovered during testing)

### Fix 5: Table sort broken — MatSort directive missing (table.component.ts)

The `@ViewChild(MatSort)` resolved to `undefined` because the `tailwindSort` directive
was never added to the table template after the Angular Material → Tailwind migration.
Sort clicks silently failed. Fixed by dispatching sort directly through
`paginationController` and tracking sort state locally. Added sort direction indicators
(sort icon with rotation) matching the card view.

### Fix 6: Marketplace Name/Description empty — valuePath broken with zoneless CD

Dynamically created `TableCellDefaultComponent` (via `ComponentFactoryResolver`) wasn't
getting change detection after `init()` set `valueContext.value`. Fixed by calling
`component.changeDetectorRef.detectChanges()` after setup in `TableCellComponent`.
Also converted Marketplace Name/Description from `valuePath` to `getValue` for
reliability.

### Fix 7: Services table Name/Dashboard/Creation columns — MultiActionListEntity

The services wall uses `MultiActionConfig` which wraps entities in
`MultiActionListEntity`. Column `getValue` callbacks needed to unwrap via
`MultiActionListEntity.getEntity(row)`. Also added Name sort.

## Screens Needing Verification

The `detectChanges()` fix for dynamically created table cells affects every table
using `valuePath` or `getValue` in `cellDefinition`. These screens should be checked:

| Screen | Columns | Status |
|--------|---------|--------|
| Marketplace | Name, Description | ✅ Fixed |
| Services Wall | Name, Dashboard, Creation Date | ✅ Fixed |
| Endpoints | Creator | Needs verification |
| Service Plans | Description | Needs verification |
| App Routes | Mapped Apps Count | Needs verification |
| App Variables | Name | Needs verification |
| CF Cells | Cell ID, Name, Deployment | Needs verification |
| Detach Apps | App Name | Needs verification |
| Users Space Roles | Name | Needs verification |
| Kubernetes Pods | Namespace, Node | Needs verification |
| Kubernetes Services | Cluster IP, Type | Needs verification |
| Helm Releases | Name, Namespace, Chart Version | Needs verification |
| GitHub Commits | Message | Needs verification |
| API Keys | Comment | Needs verification |
| Autoscaler Events | Error | Needs verification |

## Outstanding Issues

- **Org/Space filter cascade**: Setting org back to "All" does not reset space to "All"
- **Table cell styling**: Cells need visual polish (spacing, alignment, typography)

## Files Modified

| File | Change |
|------|--------|
| `list-data-source.ts` | Remove publishReplay/isLoading gate for local lists; cache `connect()` |
| `list.component.ts` | Add `markForCheck()` to paginationStoreToWidget and filterStoreToWidget |
| `table.component.ts` | Replace MatSort ViewChild with direct paginationController sort dispatch |
| `table.component.html` | `track $index` → `track dataSource.trackBy(i, row)`; sort direction icons |
| `table-cell.component.ts` | Add `detectChanges()` for dynamically created cells (zoneless fix) |
| `app-table-cell-default.component.ts` | Add `markForCheck()` after `init()` |
| `cf-service-instances-list-config.base.ts` | MultiActionListEntity unwrap for Name/Dashboard/Creation; Name sort |
| `cf-services-list-config.service.ts` | Convert Marketplace Name/Description from valuePath to getValue |
| `list.component.spec.ts` | 8 new unit tests |
| `local-list-controller.spec.ts` | 6 new pipeline tests |
| `e2e/tests/core/list-filter.spec.ts` | 10 new E2E tests (table, card, cross-view) |

## Verification (confirmed on adepttech)

1. ✅ Navigate to Applications page
2. ✅ Type "open" in filter → shows "openproject" (matches "open")
3. ✅ Item count updates to "1 - 1 of 1"
4. ✅ Click X button → filter clears, all apps return
5. ✅ Press Escape → same behavior as X button
6. ✅ Table view shows correct filtered rows (not stale data)
7. ✅ Card view shows correct filtered cards
8. ✅ Switching views preserves filter and shows correct data
