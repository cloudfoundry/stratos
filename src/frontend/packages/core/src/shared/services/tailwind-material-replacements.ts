import { InjectionToken } from '@angular/core';

// Type aliases for Material Design replacements
// MatSnackBar is exported from tailwind-snackbar.service
export type MatSnackBarRef<T> = any; // Will be replaced with TailwindSnackBarRef<T>
// SimpleSnackBar is exported from tailwind-snackbar.service
// MatDialog is exported from tailwind-dialog.service
// MatDialogRef is exported from tailwind-dialog.service
// Re-export classes directly for provider usage
export {
  TailwindErrorStateMatcher as ErrorStateMatcher,
  TailwindShowOnDirtyErrorStateMatcher as ShowOnDirtyErrorStateMatcher,
  TailwindDefaultErrorStateMatcher as DefaultErrorStateMatcher
} from './tailwind-error-state-matcher';
export type MatSidenav = any; // Will be replaced with TailwindSidenav
export type MatSidenavContainer = any; // Will be replaced with TailwindSidenavService
// MatSort is exported from tailwind-sort.service
export type MatSortHeader = any; // Will be replaced with TailwindSortHeaderDirective
// MatPaginator is exported from tailwind-paginator.service
// PageEvent is exported from tailwind-paginator.service
export type MatDrawer = any; // Will be replaced with TailwindSidenav

// Additional Angular Material types
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
  TailwindSimpleSnackBar as SimpleSnackBar
} from './tailwind-snackbar.service';

export {
  TailwindIconRegistry as MatIconRegistry
} from './tailwind-icon-registry.service';

// Injection tokens for backward compatibility
export const MAT_DIALOG_DATA = new InjectionToken<any>('StratosDialogData');
export const MAT_SNACK_BAR_DATA = new InjectionToken<any>('StratosSnackBarData');

// Export dialog services for injection
export {
  TailwindDialogService as MatDialog,
  TailwindDialogRef as MatDialogRef,
  TailwindDialogRefImpl
} from './tailwind-dialog.service';

// Create a factory for MatDialogRef that handles generics
export function createMatDialogRef<T = any, R = any>(componentInstance?: T): TailwindDialogRefImpl<T, R> {
  return new TailwindDialogRefImpl<T, R>(
    componentInstance as T,
    () => {} // empty close callback
  );
}

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