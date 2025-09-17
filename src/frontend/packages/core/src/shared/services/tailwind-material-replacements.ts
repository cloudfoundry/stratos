// Type aliases for Material Design replacements
export type MatSnackBar = any; // Will be replaced with TailwindSnackBarService
export type MatSnackBarRef<T> = any; // Will be replaced with TailwindSnackBarRef<T>
export type SimpleSnackBar = any;
export type MatDialog = any; // Will be replaced with TailwindDialogService
export type MatDialogRef<T, R = any> = any; // Will be replaced with TailwindDialogRef<T, R>
export type ErrorStateMatcher = any; // Will be replaced with TailwindErrorStateMatcher
export type ShowOnDirtyErrorStateMatcher = any; // Will be replaced with TailwindShowOnDirtyErrorStateMatcher

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