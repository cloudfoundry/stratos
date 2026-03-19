# FWT-852: Material Design Dependency Analysis

## Status: Complete

## Key Finding

**Angular Material (`@angular/material`) has already been fully removed.** It is
not in `package.json`. All Material components have been replaced with custom
Tailwind-based wrappers. Only `@angular/cdk` (v20.2.10) remains for non-UI
utilities.

## Inventory

### Custom Component Replacements

| Material Component | Custom Replacement | Selector | Usage (files) |
|---|---|---|---|
| MatFormField | CustomFormFieldComponent | `app-form-field` | 36 |
| MatSelect | CustomSelectComponent | `app-select` | 21 |
| MatOption | CustomOptionComponent | `app-option` | 20 |
| MatTab | CustomTabGroupComponent | `app-tab-group` | 17 |
| MatCheckbox | CustomCheckboxComponent | `app-checkbox` | 14 |
| MatSlideToggle | CustomSlideToggleComponent | `app-slide-toggle` | 5 |
| MatCard | CustomCardComponent | `mat-card` | 2 |
| MatButtonToggle | CustomButtonToggleComponent | `app-button-toggle` | 1 |
| MatExpansionPanel | CustomExpansionPanelComponent | `app-expansion-panel` | 0 |
| MatSpinner | CustomSpinnerComponent | `mat-spinner` | various |
| MatProgressBar | CustomProgressBarComponent | `mat-progress-bar` | various |
| MatDialog | CustomDialog* Components | `mat-dialog-*` | via service |
| MatTooltip | CustomTooltipDirective | `[matTooltip]` | 59 |

All wrappers live under `core/src/shared/components/custom-*/`.

### Service Replacements

| Material Service | Tailwind Replacement | File |
|---|---|---|
| MatDialog | TailwindDialogService | `tailwind-dialog.service.ts` |
| MatSnackBar | TailwindSnackBarService | `tailwind-snackbar.service.ts` |
| MatSidenav | TailwindSidenav | `tailwind-sidenav.service.ts` |
| MatSort | TailwindSort | `tailwind-sort.service.ts` |
| MatPaginator | TailwindPaginator | `tailwind-paginator.service.ts` |
| MatIconRegistry | TailwindIconRegistry | `tailwind-icon-registry.service.ts` |

Type aliases in `tailwind-material-replacements.ts` provide compile-time
compatibility for code still referencing Material types.

### Angular CDK Usage (retained)

| Module | Files | Purpose |
|---|---|---|
| `@angular/cdk/portal` | 8 | Dynamic component insertion |
| `@angular/cdk/scrolling` | 4 | Virtual scrolling, ScrollDispatcher |
| `@angular/cdk/layout` | 1 | BreakpointObserver for responsive |
| `@angular/cdk/a11y` | 1 | Accessibility (A11yModule) |
| `@angular/cdk/table` | 4 (tests) | DataSource abstraction |

CDK provides essential non-UI utilities with no visual dependency on Material
Design. It should be retained.

### Remaining Cleanup

| Item | Scope | Effort |
|---|---|---|
| Material compatibility CSS (`main.scss` lines 670-797) | ~130 lines of `.mat-mdc-*` selectors mapped via `@apply` | Small — remove once templates stop using `.mat-*` classes |
| `tailwind-material-replacements.ts` type aliases | Shim layer (`MatCheckboxChange`, `MatSort`, etc.) | Small — inline/remove incrementally |
| Raw gray classes (FWT-847) | 38 files, 9 Priority 1 done | Medium — mechanical replacement |

### Classification

| Dependency | Classification | Action |
|---|---|---|
| `@angular/material` | **Removed** | Already gone |
| `@angular/cdk` | **Keep** | Essential non-UI utilities |
| Custom `mat-*` selectors in components | **Wrap** | Working, rename selectors incrementally |
| `.mat-mdc-*` CSS compatibility layer | **Replace** | Remove after template selector cleanup |
| Type alias shims | **Replace** | Inline actual types where used |
| Raw gray classes | **Replace** | FWT-847 sweep (Priority 1 done) |

## Risk Assessment

**Risk of removing `@angular/cdk`: Medium** — Portal and ScrollDispatcher are
deeply integrated. Keep CDK.

**Risk of removing CSS compatibility layer: Low** — Can be done file-by-file
as custom components already use `app-*` selectors. The `.mat-*` CSS rules
only style leftover Material class names in templates.

**Risk of removing type aliases: Low** — Grep for each type, replace with
`any` or proper custom type, remove shim.

## Recommendation

No phased migration needed — the migration is already done. Remaining work is
cleanup (FWT-847 gray sweep + CSS/type shim removal), not migration. These
can be done incrementally as part of regular development.
