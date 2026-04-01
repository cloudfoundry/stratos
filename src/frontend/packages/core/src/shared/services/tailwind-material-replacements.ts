import { InjectionToken } from '@angular/core';

// Re-export Tailwind services directly (no aliases)
export {
  TailwindDialogService,
  TailwindDialogRef
} from './tailwind-dialog.service';

// Re-export classes directly for provider usage
// Note: ErrorStateMatcher and ShowOnDirtyErrorStateMatcher are exported from tailwind-error-state-matcher.ts
// to avoid duplicate exports in public-api.ts
export {
  TailwindDefaultErrorStateMatcher as DefaultErrorStateMatcher
} from './tailwind-error-state-matcher';

// Full Material component implementations
export {
  TailwindSimpleSnackBar as SimpleSnackBar
} from './tailwind-snackbar.service';

export {
  TailwindIconRegistry as MatIconRegistry
} from './tailwind-icon-registry.service';

// Export dialog data token for injection
export {
  MAT_DIALOG_DATA
} from './tailwind-dialog.service';

// Snackbar data token
export const MAT_SNACK_BAR_DATA = new InjectionToken<any>('StratosSnackBarData');

// Re-export our Tailwind implementations
export {
  TailwindSnackBarService as StratosSnackBarService,
  TailwindSnackBarRef as StratosSnackBarRef,
  TailwindSnackBarRefImpl as StratosSnackBarRefImpl,
  TailwindSnackBarConfig as StratosSnackBarConfig
} from './tailwind-snackbar.service';

export {
  TailwindDialogService as StratosDialogService,
  TailwindDialogRef as StratosDialogRef,
  TailwindDialogRefImpl as StratosDialogRefImpl,
  TailwindDialogConfig as StratosDialogConfig
} from './tailwind-dialog.service';

export {
  TailwindDefaultErrorStateMatcher
} from './tailwind-error-state-matcher';

export {
  TailwindSidenav as StratosSidenav,
  TailwindSidenavService as StratosSidenavService,
  TailwindSidenavConfig as StratosSidenavConfig
} from './tailwind-sidenav.service';

export {
  TailwindSortDirective as MatSort,
  TailwindSortHeaderDirective as StratosSortHeaderDirective,
  TailwindSortService as StratosSortService,
  TailwindSort as StratosSort,
  TailwindSortDirection as StratosSortDirection,
  TailwindSortable as StratosSortable
} from './tailwind-sort.service';

export {
  TailwindPaginator as MatPaginator,
  TailwindPaginatorService as StratosPaginatorService,
  TailwindPageEvent as PageEvent
} from './tailwind-paginator.service';

export {
  TailwindJsonSchemaFormComponent as StratosJsonSchemaFormComponent,
  TailwindJsonSchemaFormService as StratosJsonSchemaFormService,
  JsonSchemaFormData as StratosJsonSchemaFormData,
  JsonSchemaFormConfig as StratosJsonSchemaFormConfig
} from './tailwind-json-schema-form.service';

// Factory removed - use TailwindDialogService.open() instead