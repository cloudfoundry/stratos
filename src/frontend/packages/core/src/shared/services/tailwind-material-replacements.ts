import { InjectionToken } from '@angular/core';

// Type aliases for Material Design replacements
export type MatSnackBar = any; // Will be replaced with TailwindSnackBarService
export type MatSnackBarRef<T> = any; // Will be replaced with TailwindSnackBarRef<T>
export type SimpleSnackBar = any;
export type MatDialog = any; // Will be replaced with TailwindDialogService
export type MatDialogRef<T, R = any> = any; // Will be replaced with TailwindDialogRef<T, R>
// Re-export classes directly for provider usage
export {
  TailwindErrorStateMatcher as ErrorStateMatcher,
  TailwindShowOnDirtyErrorStateMatcher as ShowOnDirtyErrorStateMatcher,
  TailwindDefaultErrorStateMatcher as DefaultErrorStateMatcher
} from './tailwind-error-state-matcher';
export type MatSidenav = any; // Will be replaced with TailwindSidenav
export type MatSidenavContainer = any; // Will be replaced with TailwindSidenavService
export type MatSort = any; // Will be replaced with TailwindSortDirective
export type MatSortHeader = any; // Will be replaced with TailwindSortHeaderDirective
export type MatPaginator = any; // Will be replaced with TailwindPaginator
export type PageEvent = any; // Will be replaced with TailwindPageEvent
export type MatDrawer = any; // Will be replaced with TailwindSidenav

// Additional Angular Material types
export type MatIconRegistry = any;
export type MatChipInputEvent = any;
export type MatRadioChange = any;
export type MatCheckboxChange = any;
export type MatIcon = any;
export type Sort = any; // Will be replaced with TailwindSort

// Angular Flex Layout types (replaced with Tailwind CSS classes)
export type FlexLayoutModule = any;
export type FlexModule = any;
export type GridModule = any;

// Full Material component implementations
export {
  TailwindSnackBarRef as SimpleSnackBar
} from './tailwind-snackbar.service';

export {
  TailwindIconRegistry as MatIconRegistry
} from './tailwind-icon-registry.service';

// Injection tokens for backward compatibility
export const MAT_DIALOG_DATA = new InjectionToken<any>('StratosDialogData');
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
  TailwindErrorStateMatcher,
  TailwindShowOnDirtyErrorStateMatcher,
  TailwindDefaultErrorStateMatcher,
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher
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