# Raw Gray → Semantic Color Sweep

## Status: Priority 1 complete, Priority 2-3 remaining

## Context

The September 2025 Tailwind migration (`b4c5d84df`) introduced raw gray classes
(`text-gray-900`, `text-gray-500`, etc.) across all templates. After analysis,
many of these are **correct** — elements on explicit fixed backgrounds (dialogs,
dropdowns, tables) should use raw Tailwind grays. The actual bugs are limited to
elements that render on theme-controlled backgrounds without proper dark mode
handling.

- **Jira**: FWT-847 (related to FWT-811 umbrella)
- **Branch**: TBD
- **Origin**: Tailwind migration debt (not Angular upgrade)

## Key Finding: `.card` class sets semantic color

```scss
.card {
  color: var(--content-text);  // Already semantic
}
```

Raw grays inside `.card` elements **override** this correct behavior. Elements on
explicit backgrounds (`bg-white`, `bg-gray-800`) correctly use raw grays — that's
standard Tailwind.

## Replacement Rules

Only apply where elements inherit theme background (no explicit `bg-*` set):

| Raw Class | Replacement | Category |
|-----------|-------------|----------|
| `text-gray-900` | `text-content-text` | Primary text |
| `text-gray-800` | `text-content-text` | Primary text |
| `text-gray-700` | `text-content-text` | Primary text |
| `text-gray-600` | `text-content-muted` | Muted text |
| `text-gray-500` | `text-content-muted` | Muted text |
| `text-gray-400` | `text-content-muted` | Muted text |
| `dark:text-slate-*` | REMOVE | Redundant when using semantic |
| `dark:text-gray-*` | REMOVE | Redundant when using semantic |

## Category 1: Correct as-is (explicit backgrounds — DO NOT CHANGE)

These files use raw grays on elements with explicit fixed backgrounds. This is
correct Tailwind usage and should not be converted to semantic classes.

| File | Background | Why correct |
|------|------------|-------------|
| `dialog-confirm.component.html` | `bg-white dark:bg-gray-800` | Dialog has explicit bg |
| `page-header.component.html` (dropdowns) | `bg-white` | Dropdown menus explicitly white |
| `diagnostics-page.component.html` (tables) | `bg-white dark:bg-gray-900` | Table has explicit bg |
| `autoscaler-tab-extension.component.html` (tables) | `bg-white dark:bg-gray-900` | Table has explicit bg |
| `login-page.component.html` | `loginCardBackground()` | Card has explicit computed bg |
| `date-time.component.html` | `dark:bg-gray-700` | Input has explicit dark bg |

## Category 2: Needs fix (theme background, broken or fragile)

These files render text on theme-controlled backgrounds where raw grays either
break in dark mode or override the `.card` semantic color.

### Priority 1 — Broken in dark mode (no dark variant) ✅ DONE

All 9 files fixed: `text-gray-500` → `text-content-muted` (2026-03-18)

| File | Lines | Status |
|------|-------|--------|
| `tailwind-json-schema-form.component.html` | 103, 111 | ✅ |
| `deploy-application-options-step.component.html` | 21,27,58,85,92,116 | ✅ |
| `deploy-application-step2.component.html` | 143 | ✅ |
| `application-wall.component.html` | 31 | ✅ |
| `services-wall.component.html` | 32 | ✅ |
| `endpoints-page.component.html` | 28 | ✅ |
| `chips.component.html` | 2 | ✅ |
| `file-input.component.html` | 10 | ✅ |
| `card-autoscaler-default.component.html` | 19, 29 | ✅ |

### Priority 2 — Overrides `.card` semantic color

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `card-boolean-metric.component.html` | 9, 16 | `text-gray-900` | → `text-content-text` |
| `card-boolean-metric.component.html` | 10, 17 | `text-gray-500` | → `text-content-muted` |
| `card-number-metric.component.html` | 10 | `text-gray-400 dark:text-slate-500` | → `text-content-muted` (remove dark) |
| `card-number-metric.component.html` | 16 | `'text-gray-400': isUnlimited` | → `'text-content-muted': isUnlimited` |
| `card-number-metric.component.html` | 26, 34, 76, 83 | `text-gray-500 dark:text-slate-400` | → `text-content-muted` (remove dark) |
| `stratos-title.component.html` | 3 | `text-gray-900 dark:text-gray-100` | → `text-content-text` (remove dark) |
| `stratos-title.component.html` | 7 | `text-gray-600 dark:text-gray-400` | → `text-content-muted` (remove dark) |
| `details-card.component.html` | 9 | `text-gray-900` | → `text-content-text` |

### Priority 3 — On page/form background (no explicit bg)

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `console-uaa-wizard.component.html` | 10,21,43,69,73,93 | `text-gray-700` | → `text-content-text` |
| `local-account-wizard.component.html` | 13, 15 | `text-gray-700` | → `text-content-text` |
| `setup-welcome.component.html` | 12 | `text-gray-900` | → `text-content-text` |
| `setup-welcome.component.html` | 13 | `text-gray-700` | → `text-content-text` |
| `upgrade-page.component.html` | 9 | `text-gray-800` | → `text-content-text` |
| `upgrade-page.component.html` | 12 | `text-gray-600` | → `text-content-muted` |
| `domain-mismatch.component.html` | 11 | `text-gray-700` | → `text-content-text` |
| `events-page.component.html` | 26,36,46 | `[class.text-gray-700]` | → `[class.text-content-text]` |
| `events-page.component.html` | 66 | `text-gray-900` | → `text-content-text` |
| `events-page.component.html` | 84 | `text-gray-600` | → `text-content-muted` |
| `tailwind-json-schema-form.component.html` | 7,33,59,95 | `text-gray-700 dark:text-gray-300` | → `text-content-text` (remove dark) |
| `metrics.component.html` | 10, 41 | `text-gray-900` | → `text-content-text` |
| `metrics.component.html` | 15, 42 | `text-gray-600` | → `text-content-muted` |
| `metrics.component.html` | 26 | `text-gray-500` | → `text-content-muted` |
| `restore-endpoints.component.html` | 9, 60 | `text-gray-700` | → `text-content-text` |
| `restore-endpoints.component.html` | 15 | `text-gray-600` | → `text-content-muted` |
| `card-progress-overlay.component.html` | 4 | `text-gray-900 dark:text-gray-100` | → `text-content-text` (remove dark) |
| `copy-to-clipboard.component.html` | 16 | `text-gray-500 hover:text-gray-700` | → `text-content-muted hover:text-content-text` |
| `boolean-indicator.component.html` | 7 | `'text-gray-400': subtle` | → `'text-content-muted': subtle` |
| `boolean-indicator.component.html` | 14 | `text-gray-700` | → `text-content-text` |
| `meta-card.component.html` | 47 | `text-gray-700 dark:text-gray-200` | → `text-content-text` (remove dark) |
| `list.component.html` | 122 | `text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300` | → `text-content-muted hover:text-content-text` (remove darks) |
| `list.component.html` | 282 | `text-gray-500` | → `text-content-muted` |

### Priority 3 — Cloud-Foundry forms (on page background)

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `specify-details-step.component.html` | 8 | `text-gray-900` | → `text-content-text` |
| `specify-details-step.component.html` | 35 | `text-gray-700` | → `text-content-text` |
| `specify-details-step.component.html` | 38 | `text-gray-500 hover:text-gray-700` | → `text-content-muted hover:text-content-text` |
| `specify-user-provided-details.component.html` | 7 | `text-gray-900` | → `text-content-text` |
| `specify-user-provided-details.component.html` | 54 | `text-gray-700` | → `text-content-text` |
| `specify-user-provided-details.component.html` | 56 | `text-gray-500 hover:text-gray-700` | → `text-content-muted hover:text-content-text` |
| `manage-users-set-usernames.component.html` | 7, 11 | `text-gray-900` | → `text-content-text` |
| `schema-form.component.html` | 8, 12 | `text-gray-900` | → `text-content-text` |
| `add-routes.component.html` | 7 | `text-gray-900` | → `text-content-text` |
| `create-application-step1.component.html` | 58 | `text-gray-600 dark:text-gray-400` | → `text-content-muted` (remove dark) |

### Priority 3 — Git package

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `git-registration.component.html` | 18 | `text-gray-900` | → `text-content-text` |
| `git-registration.component.html` | 20 | `text-gray-600` | → `text-content-muted` |
| `git-registration.component.html` | 21 | `[class.text-gray-400]` | → `[class.text-content-muted]` |
| `git-endpoint-details.component.html` | 9 | `text-gray-900` | → `text-content-text` |
| `git-endpoint-details.component.html` | 13 | `text-gray-500` | → `text-content-muted` |
| `github-commit-author.component.html` | 8 | `text-gray-900` | → `text-content-text` |

### Priority 3 — Autoscaler forms

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `edit-autoscaler-policy-step1.component.html` | 3 | `text-gray-700` | → `text-content-text` |
| `edit-autoscaler-policy-step2.component.html` | 3, 17 | `text-gray-700` | → `text-content-text` |
| `edit-autoscaler-policy-step3.component.html` | 3, 17 | `text-gray-700` | → `text-content-text` |
| `edit-autoscaler-policy-step4.component.html` | 3, 17 | `text-gray-700` | → `text-content-text` |
| `app-autoscaler-metric-chart-card.component.html` | 6 | `text-gray-600` | → `text-content-muted` |

### Priority 3 — Kubernetes

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `analysis-report-selector.component.html` | 8, 15, 25 | `text-gray-700` | → `text-content-text` |
| `analysis-report-selector.component.html` | 27 | `text-gray-900` | → `text-content-text` |
| `analysis-report-selector.component.html` | 29 | `text-gray-400` | → `text-content-muted` |

## Scope Summary

| Category | Files | Action |
|----------|-------|--------|
| Correct as-is | 6 | No change — explicit backgrounds |
| Priority 1 — broken dark mode | 9 | Fix first — `text-gray-500` with no dark variant |
| Priority 2 — card override | 4 | Fix — raw grays override `.card` semantic color |
| Priority 3 — page/form bg | ~25 | Fix — on theme-controlled backgrounds |

**Total files needing changes: ~38**
**Total files correct as-is: 6**

## Approach

1. Priority 1 first: fix `text-gray-500` with missing dark variants
2. Priority 2: fix card-interior overrides
3. Priority 3: batch sweep of page/form background elements
4. Skip: elements on explicit `bg-white`/`bg-gray-*` backgrounds
5. Skip: table `<th>` headers (intentional subtle style)
6. Skip: border classes (separate lower-priority category)
7. Visual QA on key screens after each priority
8. Run full Vitest + Playwright suite
