# Pagination Architecture

Developer guide to the Stratos list pagination system. This covers the data flow from store to UI, the view toggle mechanism, the "All" page size handling, and common pitfalls.

## Component Overview

```
ListComponent (list.component.ts)
  ├── view$ ─── controls card/table toggle
  ├── paginatorSettings ─── plain object bridging store → paginator
  ├── PageSizeSessionService ─── in-memory per-view page size memory
  │
  ├── AppPaginatorComponent (app-paginator.component.ts)
  │     ├── pageSize @Input ─── setter resolves PAGE_SIZE_ALL
  │     ├── selectValue getter ─── drives <select> display
  │     └── changePageSize() ─── user interaction → emits page event
  │
  └── LocalListController (local-list-controller.ts)
        ├── splitCurrentPage() ─── splits entity array into pages
        ├── isPaginationMaxed() ─── gates data when entity count exceeds server limit
        └── page$ ─── final paginated output
```

## Data Flow

### Store → UI (read path)

1. `pagination$` (NgRx store selector) emits `PaginationEntityState`
2. `ListPaginationController.createPaginationObservable()` maps to `ListPagination { pageSize, pageIndex, totalResults }`
   - For local lists: reads from `clientPagination.pageSize`
   - For remote lists: reads from `params['results-per-page']`
3. `paginationStoreToWidget` tap sets `paginatorSettings.{length, pageIndex, pageSize}`
4. Angular change detection propagates to `AppPaginatorComponent` inputs

### UI → Store (write path)

1. User selects page size from dropdown → `(change)` event
2. `AppPaginatorComponent.changePageSize()` resolves effective size, emits `TailwindPageEvent`
3. `ListComponent.onPaginateChange()` dispatches to store and saves to session:
   - `paginationController.pageSize(effectiveSize)` → dispatches `SetClientPageSize`
   - `pageSizeSession.set(viewKey, size)` — stores per-view and base key
4. Store updates trigger the read path above

### View Toggle Flow

1. `view$` emits new view ('cards' or 'table')
2. `list.component.ts` view$ subscription:
   - Sets new `pageSizeOptions` (card vs table sizes)
   - Reads per-view remembered size from `PageSizeSessionService` using `hasExplicit(viewKey)`
   - Falls back to first option if no explicit choice for this view
   - Resolves `PAGE_SIZE_ALL` (-1) to effective count before store dispatch
   - Sets `paginatorSettings.pageSize` for the paginator
   - Dispatches `SetClientPageSize` with the effective (non-negative) size
   - Resets to page 0

## Page Size Value Ranges

Page size values are split into two domains: positive literal sizes and negative sentinel values.

| Value | Meaning | Example |
|-------|---------|---------|
| **n > 0** | Literal page size — show exactly n items per page | 6, 10, 12, 24, 50 |
| **0** | Invalid/empty — guard treats as "show all" in `splitCurrentPage` | — |
| **-1** | Sentinel: `PAGE_SIZE_ALL` — show all items | Resolved to `totalItems` |
| **-2, -3, ...** | Available for future sentinels (not yet defined) | Could be PAGE_SIZE_HALF, etc. |

### Where each value is valid

| Layer | Positive n | 0 | Sentinels (< 0) |
|-------|-----------|---|-----------------|
| Options list | Yes | No | Yes (displayed as label) |
| Session storage | Yes | No | Yes (remembers sentinel, not resolved value) |
| Store (`clientPagination.pageSize`) | Yes | No | **No — always resolve first** |
| `splitCurrentPage` | Yes | Returns all | Returns all (guard: `<= 0`) |
| Paginator `@Input` | Yes | — | Yes (setter resolves via registry) |

### Sentinel Registry

Sentinels are defined in `list.component.types.ts` via the `PAGE_SIZE_SENTINELS` array. Each entry maps a negative value to a label and a resolve function:

```typescript
const PAGE_SIZE_SENTINELS: PageSizeSentinel[] = [
  { value: -1, label: 'All', resolve: (total) => total || 1 },
  // Future sentinels:
  // { value: -2, label: 'Half', resolve: (total) => Math.ceil(total / 2) },
];
```

Three utility functions centralize all sentinel handling:

- `isPageSizeSentinel(value)` — returns true if value is a registered sentinel
- `resolvePageSize(value, totalItems)` — resolves sentinel to effective count, passes through positive values unchanged
- `getPageSizeLabel(value)` — returns display label ("All") for sentinels, stringified number for literals

To add a new sentinel: add an entry to `PAGE_SIZE_SENTINELS`, add the constant (e.g., `export const PAGE_SIZE_HALF = -2`), and include it in the options arrays. No other code changes needed — `resolvePageSize`, `isPageSizeSentinel`, `getPageSizeLabel`, `splitCurrentPage`, and the paginator all handle it automatically.

### Critical: Sentinels never enter the store

The store (`clientPagination.pageSize`) must always hold a resolved positive count. All dispatch points resolve sentinels first:

```typescript
const effectiveSize = resolvePageSize(targetSize, this.paginatorSettings.length);
this.store.dispatch(new SetClientPageSize(..., effectiveSize));
```

`splitCurrentPage` has a `pageSize <= 0` guard as a safety net, but the store should never contain a sentinel value.

## PageSizeSessionService

In-memory service (no persistence across reloads) that remembers page size choices:

```typescript
get(key)         // Returns screens[key] ?? lastExplicit
set(key, size)   // Sets screens[key] and lastExplicit
hasExplicit(key) // Returns screens.has(key)
```

### Cross-view fallback pitfall

`get()` falls back to `lastExplicit` when the specific key isn't found. This is useful for cross-screen inheritance (navigating from orgs to apps inherits the last choice) but causes problems for view toggles within the same list.

**The view toggle uses `hasExplicit(viewKey)` to avoid this fallback.** If no explicit choice was made for this specific view, it uses the view's default (first option) instead of inheriting from the other view.

Session keys:
- `${paginationKey}:cards` — card view choice
- `${paginationKey}:table` — table view choice
- `${paginationKey}` — base key (last explicit from any view, used for cross-screen)

## Paginator Component

### Select binding

The `<select>` uses `[selected]` per-option rather than `[value]` on the select element:

```html
<option [value]="option" [selected]="option === selectValue">
```

This prevents the browser from resetting the select to the first option when Angular re-renders the `@for` loop (which happens on every view toggle when options change).

### selectValue getter logic

```typescript
get selectValue(): number {
  if (this._isAllSelected) return PAGE_SIZE_ALL;           // explicit "All" selection
  if (this.pageSizeOptions.includes(this._pageSize))       // known option
    return this._pageSize;
  if (this.pageSizeOptions.includes(PAGE_SIZE_ALL))        // resolved "All" value (e.g., 49)
    return PAGE_SIZE_ALL;
  return this._pageSize;                                    // fallback
}
```

The third case handles the store-to-widget sync: when the store has the resolved "All" value (e.g., 49) which isn't in the options list, the getter infers "All" should be shown.

### pageSize setter

Always clears `_isAllSelected` on non-ALL values. This ensures the flag doesn't persist across view toggles when the paginator receives a new page size from the list component.

## LocalListController & splitCurrentPage

### Maxed gate

```typescript
cleanPagination$.pipe(
  map(pagination => isPaginationMaxed(pagination)),
  distinctUntilChanged(),
  switchMap(maxed => maxed ? of([]) : fullPageObs$)
)
```

`isPaginationMaxed` checks `pageRequests` for `maxed: true` flags. This is for server-side pagination limits (e.g., >5000 CF apps). For local lists with small counts, this should always be false.

### splitCurrentPage

Splits a flat entity array into pages based on `pageSize` and `currentPage`. Handles:
- Already-split arrays (entries that are arrays)
- `pageSize <= 0`: returns all items as a single page (PAGE_SIZE_ALL support)
- Page index beyond available data: returns null index

## State Machines

### User Perspective

What the user sees and what triggers transitions.

```
                          ┌─────────────────────────┐
                          │     LIST LOADING         │
                          │  progress bar, 0 of 0    │
                          └───────────┬─────────────┘
                                      │ data arrives
                                      ▼
                    ┌──────────────────────────────────────┐
                    │          BROWSING (card or table)     │
                    │  Items per page: [6▼]  1-6 of 49     │
                    └──┬───────┬────────┬────────┬────────┘
                       │       │        │        │
          change size  │  page │  view  │ filter │  sort
                       ▼  nav  ▼ toggle ▼  /org  ▼  column
                    ┌──────────────────────────────────────┐
                    │       BROWSING (updated)              │
                    │  Items per page: [12▼]  1-12 of 49   │
                    └──────────────────────────────────────┘
```

**User actions and their effects:**

| Action | Dropdown | Paginator Info | Visible Items | Session Stored |
|--------|----------|----------------|---------------|----------------|
| Select page size (e.g., 12) | Shows 12 | 1-12 of N | 12 items | `key:view = 12`, `key = 12` |
| Select "All" | Shows All | 1-N of N | All items | `key:view = -1`, `key = -1` |
| Toggle card → table | Shows table default or remembered | Updates | Matches new size | No write (reads only) |
| Navigate away and back | Shows remembered or default | Updates | Matches size | No write |
| Page reload | Shows default (6 or 10) | Updates | Matches default | Session cleared |

### NgRx Store Perspective

The store holds `PaginationEntityState` per entity type + pagination key.

```
PaginationEntityState
  ├── ids: { [page]: string[] }          ← server-fetched page data
  ├── pageRequests: { [page]: { maxed, busy, error } }
  ├── currentPage: number                ← server pagination cursor
  ├── totalResults: number
  ├── params: { order-direction, order-direction-field, ... }
  │
  └── clientPagination                   ← LOCAL list pagination
        ├── pageSize: number             ← NEVER -1, always resolved
        ├── currentPage: number          ← 1-indexed
        ├── totalResults: number
        └── filter: { string, items, filterKey }
```

**Store transitions:**

```
  ┌─────────────┐  SetClientPageSize(n)   ┌─────────────┐
  │ pageSize: 6  │ ─────────────────────► │ pageSize: 12 │
  └─────────────┘                         └─────────────┘
         │                                       │
         │  SetClientPage(1)                     │  SetClientPage(1)
         ▼                                       ▼
  ┌──────────────┐                        ┌──────────────┐
  │ currentPage:1│                        │ currentPage:1│
  └──────────────┘                        └──────────────┘
```

**Reducers involved:**

| Action | Reducer | Fields Changed |
|--------|---------|---------------|
| `SetClientPageSize` | `paginationSetClientPageSize` | `clientPagination.pageSize` only |
| `SetClientPage` | `paginationSetClientPage` | `clientPagination.currentPage` only |
| `SetClientFilter` | `paginationSetClientFilter` | `clientPagination.filter` |
| `AddParams` | `paginationAddParams` | `params` (sort direction, etc.) |

Each reducer returns the same state object (no-op) if the value hasn't changed, preventing unnecessary observable emissions.

### Paginator Component Perspective

Internal state machine for `AppPaginatorComponent`.

```
                    ┌─────────────────────┐
                    │  INITIAL            │
                    │  _pageSize = 50     │
                    │  _isAllSelected = F │
                    └─────────┬───────────┘
                              │ @Input pageSize = 6
                              ▼
                    ┌─────────────────────┐
                    │  NORMAL             │
                    │  _pageSize = 6      │
                    │  _isAllSelected = F │◄──────────────────┐
                    │  selectValue → 6    │                   │
                    └──┬──────────────────┘                   │
                       │                                      │
       user selects    │ user selects "All"    @Input set to  │
       numeric (12)    │ from dropdown         numeric (10)   │
                       ▼                       by view toggle │
                    ┌─────────────────────┐                   │
                    │  ALL SELECTED        │                   │
                    │  _pageSize = length  │───────────────────┘
                    │  _isAllSelected = T  │  @Input pageSize
                    │  selectValue → -1    │  set to non-ALL
                    └──┬──────────────────┘
                       │
                       │ store-to-widget sync sets
                       │ pageSize = 49 (resolved "All")
                       ▼
                    ┌─────────────────────┐
                    │  RESOLVED ALL        │
                    │  _pageSize = 49      │
                    │  _isAllSelected = F  │
                    │  selectValue → -1    │ ← 49 not in options,
                    └─────────────────────┘   falls through to ALL
```

**selectValue resolution chain:**

```
  _isAllSelected?  ──yes──►  return -1 (PAGE_SIZE_ALL)
       │ no
       ▼
  _pageSize in options?  ──yes──►  return _pageSize
       │ no
       ▼
  PAGE_SIZE_ALL in options?  ──yes──►  return -1 (inferred "All")
       │ no
       ▼
  return _pageSize (fallback)
```

### PageSizeSessionService Perspective

In-memory map tracking user's explicit page size choices.

```
  State: screens = Map<string, number>, lastExplicit = number | undefined

  ┌───────────────────────────┐
  │  EMPTY                    │
  │  screens: {}              │
  │  lastExplicit: undefined  │
  └────────┬──────────────────┘
           │ user selects 24 on apps:cards
           │ set("apps:cards", 24)
           │ set("apps", 24)
           ▼
  ┌───────────────────────────┐
  │  ONE VIEW SET             │
  │  screens: {               │
  │    "apps:cards": 24       │
  │    "apps": 24             │
  │  }                        │
  │  lastExplicit: 24         │
  └────────┬──────────────────┘
           │ user selects 50 on apps:table
           │ set("apps:table", 50)
           │ set("apps", 50)
           ▼
  ┌───────────────────────────┐
  │  BOTH VIEWS SET           │
  │  screens: {               │
  │    "apps:cards": 24       │
  │    "apps": 50             │
  │    "apps:table": 50       │
  │  }                        │
  │  lastExplicit: 50         │
  └───────────────────────────┘
```

**Lookup behavior:**

| Call | screens.get() | lastExplicit | Result |
|------|--------------|--------------|--------|
| `get("apps:cards")` | 24 | 50 | **24** (screen hit) |
| `get("apps:table")` | 50 | 50 | **50** (screen hit) |
| `get("orgs:cards")` | undefined | 50 | **50** (fallback) |
| `hasExplicit("apps:cards")` | — | — | **true** |
| `hasExplicit("orgs:cards")` | — | — | **false** |

**View toggle reads with `hasExplicit` to avoid cross-view pollution:**

```
  view toggle to 'cards':
    hasExplicit("apps:cards")?
      ├── yes → get("apps:cards") → 24 → use 24
      └── no  → undefined → use default (first option: 6)
```

Without `hasExplicit`, `get("apps:table")` when table was never explicitly set would return `lastExplicit` (e.g., -1 from card view's "All" selection), polluting the table view.

### LocalListController Perspective

Observable pipeline that transforms raw entity data into paginated output.

```
  pagination$ (raw store state)
       │
       ├──► cleanPagination$ ──► distinctUntilChanged(paginationHasChanged)
       │         │                  only emits on: sort, filter, totalResults,
       │         │                  forcedLocalPage changes
       │         │                  IGNORES: pageSize, currentPage
       │         │
       │         ├──► maxed gate: isPaginationMaxed?
       │         │       ├── true  → of([])  (empty — list too large)
       │         │       └── false → fullPageObs$
       │         │
       │         └──► fullPageObs$ = combineLatest(cleanPagination$, page$)
       │                   │
       │                   ├── if entities empty OR ids empty → []
       │                   ├── apply dataFunctions (sort, filter)
       │                   └── emit sorted/filtered entity array
       │
       ├──► currentPageSize$ ──► distinctUntilChanged
       │         │                  emits on: clientPagination.pageSize change
       │         │                  clears pageSplitCache on change
       │
       └──► currentPageNumber$ ──► distinctUntilChanged
                 │                  emits on: clientPagination.currentPage change
                 │
                 ▼
       page$ = combineLatest(entities$, currentPageSize$, currentPageNumber$)
                 │
                 └──► splitCurrentPage(entities, pageSize, currentPage)
                        │
                        ├── pageSize ≤ 0  → return [allEntities] (ALL)
                        ├── normal        → splice into pages, return page[index]
                        └── beyond range  → return []
```

**Key insight: two parallel paths**

Page size and page number changes flow through `currentPageSize$` and `currentPageNumber$` directly from `pagination$`. They do NOT go through `cleanPagination$`. This means:
- Changing page size triggers `splitCurrentPage` with new size (fast, local)
- Changing sort/filter triggers `fullPageObs$` to re-sort/re-filter (may involve data functions)
- The maxed gate only re-evaluates on `cleanPagination$` changes (sort/filter/totalResults)

### Angular Change Detection Perspective

All list-related components use `OnPush` change detection.

```
  ListComponent (OnPush)
    │
    │  view$ subscription sets paginatorSettings properties
    │  calls cd.markForCheck() after view toggle
    │
    ├── paginatorSettings is a PLAIN OBJECT (same reference)
    │   Properties change but reference doesn't.
    │   Angular detects changes because:
    │     1. async pipes (view$, hasRows$, etc.) mark component dirty
    │     2. cd.markForCheck() called explicitly after view toggle
    │     3. store-to-widget tap runs during subscription evaluation
    │
    └── AppPaginatorComponent (OnPush)
          │
          │  Receives @Input() bindings from paginatorSettings
          │  Re-checks when parent is checked (OnPush propagates down)
          │
          │  pageSize setter runs during input binding update
          │  selectValue getter runs during template evaluation
          │
          └── <select> with [selected] per option
                │
                │  Browser renders options from @for loop
                │  [selected] binding marks correct option
                │  No race condition with [value] on <select>
```

**Timing during view toggle:**

```
  1. view$ emits 'table'
  2. view$ subscription (synchronous):
     a. paginatorSettings.pageSizeOptions = tableOptions
     b. paginatorSettings.pageSize = targetSize
     c. store.dispatch(SetClientPageSize(effectiveSize))  ← synchronous
     d. store.dispatch(SetClientPage(1))                  ← synchronous
     e. cd.markForCheck()
  3. Store updates trigger pagination$ emission (synchronous)
  4. paginationStoreToWidget tap fires:
     a. paginatorSettings.length = totalResults
     b. paginatorSettings.pageIndex = pageIndex - 1
     c. paginatorSettings.pageSize = pagination.pageSize
  5. Angular change detection cycle runs:
     a. ListComponent checked (marked dirty by async pipes + markForCheck)
     b. Paginator inputs updated: length, pageSize, pageSizeOptions, pageIndex
     c. Paginator pageSize setter runs (with correct this.length)
     d. Template evaluates selectValue getter
     e. @for renders options with [selected] bindings
     f. Browser displays correct selection
```

## Common Pitfalls

1. **Don't dispatch PAGE_SIZE_ALL (-1) to the store** — resolve to actual count first
2. **Don't use `pageSizeSession.get()` for view toggles** — use `hasExplicit()` to avoid cross-view pollution
3. **Don't use `[value]` on `<select>` with dynamic options** — browser resets selection when options re-render; use `[selected]` per-option
4. **OnPush change detection** — the paginator won't re-render unless an @Input reference changes or an event fires; `markForCheck()` is called by the list component after view toggle
5. **`paginationHasChanged` excludes page size and page number** — `cleanPagination$` in LocalListController only emits on sort/filter/totalResults changes, not page size changes; page size changes flow through a separate observable path
