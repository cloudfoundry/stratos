// Type aliases for Material Design replacements
export type MatSnackBar = any; // Will be replaced with TailwindSnackBarService
export type MatSnackBarRef<T> = any; // Will be replaced with TailwindSnackBarRef<T>
export type SimpleSnackBar = any;
export type MatDialog = any; // Will be replaced with TailwindDialogService
export type MatDialogRef<T, R = any> = any; // Will be replaced with TailwindDialogRef<T, R>
export type ErrorStateMatcher = any; // Will be replaced with TailwindErrorStateMatcher
export type ShowOnDirtyErrorStateMatcher = any; // Will be replaced with TailwindShowOnDirtyErrorStateMatcher
export type MatSidenav = any; // Will be replaced with TailwindSidenav
export type MatSidenavContainer = any; // Will be replaced with TailwindSidenavService
export type MatSort = any; // Will be replaced with TailwindSortDirective
export type MatSortHeader = any; // Will be replaced with TailwindSortHeaderDirective
export type MatPaginator = any; // Will be replaced with TailwindPaginator
export type PageEvent = any; // Will be replaced with TailwindPageEvent

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
  TailwindErrorStateMatcher as StratosErrorStateMatcher,
  TailwindShowOnDirtyErrorStateMatcher as StratosShowOnDirtyErrorStateMatcher,
  TailwindDefaultErrorStateMatcher as StratosDefaultErrorStateMatcher
} from './tailwind-error-state-matcher';

export {
  TailwindSidenav as StratosSidenav,
  TailwindSidenavService as StratosSidenavService,
  TailwindSidenavConfig as StratosSidenavConfig
} from './tailwind-sidenav.service';

export {
  TailwindSortDirective as StratosSortDirective,
  TailwindSortHeaderDirective as StratosSortHeaderDirective,
  TailwindSortService as StratosSortService,
  TailwindSort as StratosSort,
  TailwindSortDirection as StratosSortDirection,
  TailwindSortable as StratosSortable
} from './tailwind-sort.service';

export {
  TailwindPaginator as StratosPaginator,
  TailwindPaginatorService as StratosPaginatorService,
  TailwindPageEvent as StratosPageEvent
} from './tailwind-paginator.service';

export {
  TailwindJsonSchemaFormComponent as StratosJsonSchemaFormComponent,
  TailwindJsonSchemaFormService as StratosJsonSchemaFormService,
  JsonSchemaFormData as StratosJsonSchemaFormData,
  JsonSchemaFormConfig as StratosJsonSchemaFormConfig
} from './tailwind-json-schema-form.service';