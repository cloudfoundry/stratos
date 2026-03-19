# UI Enhancement Complexity Analysis

Source: FWT-811 comments (2026-03-14)
Tracking ticket: https://fivetwenty.atlassian.net/browse/FWT-811

## Item Key (multi-item tickets)

- **FWT-805** Persist user preferences: .1 dark mode, .2 sidebar, .3 page size, .4 card/table view, .5 sort
- **FWT-806** Keyboard shortcuts: .1 / focus + Esc clear, .2 j/k navigation, .3 ? help overlay
- **FWT-808** Bulk actions: .1 checkboxes + action bar, .2 bulk connect/disconnect/delete
- **FWT-810** Clear filter + help: .1 inline X button, .2 Escape to clear, .3 contextual help popover
- **FWT-811** Consistent UI: .1 filter placeholders, .2 table view on CF screen, .3 multi-filters, .4 empty states, .5 action menus
- **FWT-812** Group/sort: .1 multi-column sort, .2 group by with collapsible sections
- **FWT-813** Cross-space views: .1 routes wall, .2 service instances wall
- **FWT-814** Lazy loading: .1 skeleton placeholders, .2 virtual scrolling (CDK)
- **FWT-815** Scroll indicators: .1 "X of Y" count, .2 shadow overflow, .3 always-visible scrollbar

## 4-Quadrant Priority Map

```
                        HIGH IMPACT                          LOW IMPACT
               +-----------------------------+-----------------------------+
               |                             |                             |
               |  DO FIRST                   |  FILL IN                    |
               |                             |                             |
   LOW         |  810.1 810.2 800  815.1     |  747   803   811.1          |
   EFFORT      |  804   817   815.2          |  802   807   811.2          |
               |  805.1 821   824            |  815.3 805.2 806.1         |
               |  825   810.3               |                             |
               +-----------------------------+-----------------------------+
               |                             |                             |
               |  PLAN CAREFULLY             |  RECONSIDER                 |
               |                             |                             |
   HIGH        |  805.3 819   812.2          |  805.4 805.5 811.3         |
   EFFORT      |  814.1 808.1 808.2          |  811.4 811.5 809           |
               |  816   813.1 813.2          |  812.1 818   814.2         |
               |  822                        |  819   823   806.2  806.3  |
               +-----------------------------+-----------------------------+

★ Sweet spot = top-left (Trivial/Simple + High Impact)
```

## Full Ordered List

| # | Ticket | Item | Effort | Impact | Status |
|---|--------|------|--------|--------|--------|
| 1 | 810.1 | Clear filter button (X) | 1-2h | High | Done |
| 2 | 810.2 | Escape key to clear filter | 1h | High | Done |
| 3 | 800 | Better page size options | 1-2h | High | Done |
| 4 | 815.1 | "Showing X of Y" count | 2-3h | High | Done |
| 5 | 825 | Style login error messages | 2-3h | High | |
| 6 | 804 | Sticky table headers | 3-4h | High | Done |
| 7 | 817 | Button contrast fix (themes) | 4-6h | High | Done |
| 8 | 815.2 | Shadow overflow indicator | 3-4h | High | Done |
| 9 | 805.1 | Persist dark mode | 3-4h | High | |
| 10 | 821 | Validate autoscaler screens | 4-6h | High | |
| 11 | 824 | Validate Prometheus integration | 4-6h | High | |
| 12 | 810.3 | Contextual help popover | 4-6h | High | |
| 13 | 747 | Fix Docs/Getting Started links | 1h | Medium | |
| 14 | 803 | Natural sort for numerics | 2-3h | Medium | |
| 15 | 811.1 | Standardize filter placeholders | 2h | Medium | |
| 16 | 802 | Regex in filter searches | 4-6h | Medium | |
| 17 | 807 | Filter text highlighting | 4-6h | Medium | |
| 18 | 811.2 | Add table view to CF screen | 3-4h | Medium | |
| 19 | 815.3 | Always-visible scrollbar | 2h | Medium | |
| 20 | 805.2 | Persist sidebar state | 3-4h | Medium | |
| 21 | 806.1 | / focus, Esc clear | 4-6h | Medium | |
| 22 | 805.3 | Persist page size per list | 4-6h | High | |
| 23 | 819 | Responsive tablet layout | 1-2d | High | |
| 24 | 812.2 | Group by collapsible sections | 2-3d | High | |
| 25 | 814.1 | Skeleton placeholders | 1-2d | High | |
| 26 | 808.1 | Selection checkboxes + action bar | 2-3d | High | |
| 27 | 808.2 | Bulk operations | 2-3d | High | |
| 28 | 805.4 | Persist card/table view | 4-6h | Medium | |
| 29 | 805.5 | Persist sort per list | 4-6h | Medium | |
| 30 | 811.3 | Consistent multi-filters | 1d | Medium | |
| 31 | 811.4 | Consistent empty states | 1d | Medium | |
| 32 | 811.5 | Consistent action menus | 1d | Medium | |
| 33 | 809 | Column visibility toggle | 1-2d | Medium | |
| 34 | 812.1 | Multi-column sort | 2-3d | Medium | |
| 35 | 806.2 | j/k navigation | 1-2d | Low | |
| 36 | 806.3 | ? help overlay | 1d | Low | |
| 37 | 816 | Research modern UI patterns | 2-3d | High | |
| 38 | 813.1 | Routes wall (cross-space) | 3-5d | High | |
| 39 | 813.2 | Service instances wall | 3-5d | High | |
| 40 | 822 | OCF Scheduler screens | 5-10d | High | |
| 41 | 818 | SCSS to Tailwind migration | 5-10d | Medium | |
| 42 | 814.2 | Virtual scrolling (CDK) | 3-5d | Medium | |
| 43 | 819 | Responsive mobile layout | 3-5d | Medium | |
| 44 | 823 | Blacksmith endpoint integration | 3-5d | Medium | |

## Notes

- Items 1-5 could be done in a day
- Items 6-12 fit in a sprint
- Items 13-22 need the preferences infrastructure (FWT-805) first
- Items 23+ are multi-day efforts where FWT-816 (research) should come before implementation
- Use one umbrella ticket for idea collection, spin off sub-tickets only at implementation time
