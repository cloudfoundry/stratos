# FWT Work Items Tracker

Track Stratos Jira tickets, their status, and decisions made during work sessions.

## Completed

| Ticket | Summary | Commit | Date |
|--------|---------|--------|------|
| FWT-834 | Apps list filter sync regression | `73354d3a7`, `267cc545f` | 2026-03-18 |
| FWT-848 | MultiFilterManager dropdown display after navigation | `37b5f0f95` | 2026-03-18 |
| FWT-835 | Angular/TS version info on About page | `8dfef408a` | 2026-03-17 |
| FWT-839 | Upgrade Angular 20.3.9 to 20.3.18 | `c3b90a342` | 2026-03-17 |
| FWT-826 | Improve Home page empty state messages | — | 2026-03-17 |

## In Review

| Ticket | Summary | Branch | Notes |
|--------|---------|--------|-------|
| FWT-810 | Clear filter button + contextual help | `feature/rewrite-packaging-script` | Includes FWT-815, 825, 804, 817, 800 |
| FWT-799 | Fix card list scrolling | `feature/rewrite-packaging-script` | |
| FWT-340 | Angular 20 update | — | Umbrella ticket |

## Backlog — Stratos UI

| Ticket | Priority | Summary | Effort | Notes |
|--------|----------|---------|--------|-------|
| FWT-849 | Medium | Space dropdown when Org is "All" | Small-medium | Modify `createSpace()` to aggregate spaces |
| FWT-847 | Medium | Raw grays → semantic colors | Small per file | 40 templates, plan in `plans/raw-gray-to-semantic-sweep.md` |
| FWT-852 | Medium | Analyze Material Design dependencies | Medium | Full migration analysis needed |
| FWT-837 | — | Filter shows wrong rows | Unknown | May be related to FWT-834 root cause |
| FWT-836 | — | Scroll shadow on non-list pages | Small | |
| FWT-811 | — | UI patterns umbrella (44 items) | Large | Priority list in `plans/ui-enhancement-analysis.md` |

## Backlog — Testing & Infrastructure

| Ticket | Priority | Summary | Effort | Notes |
|--------|----------|---------|--------|-------|
| FWT-850 | Medium | E2E fixture SSO support | Medium | `connectedEndpointsAdminPage` fails on SSO |
| FWT-851 | Low | Audit E2E locators for Tailwind | Small | Mechanical sweep of `mat-*` selectors |
| FWT-840 | Medium | Build system improvements | Medium | Due 2026-04-01 |
| FWT-677 | — | Playwright E2E coverage | Ongoing | 6 tests added for FWT-834 |

## Decisions & Learnings

### 2026-03-18

- **`[value]` vs `[selected]` on native `<select>`**: Angular's `[value]` binding
  doesn't work with async-rendered `<option>` elements. Use `[selected]` on each
  `<option>` instead. Same fix applied to paginator and list filter dropdowns.

- **localStorage filter persistence**: `ngrx-store-localstorage` persists pagination
  filter state across sessions. Hard refresh doesn't clear it. Users can clear via
  User Profile or DevTools → Local Storage.

- **E2E tests target adepttech**: Run with `STRATOS_E2E_PROFILE=adepttech
  STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca`. Use `adminPage` fixture
  (not `connectedEndpointsAdminPage`) for SSO. SecretsHelper switches cf target to
  e2e/e2e — always re-check after test runs.

- **`feature/rewrite-packaging-script` unblocked**: Was waiting on FWT-834 fix,
  which is now done on `feature/ui-additional-cleanup`.
