// Configuration for a confirmation dialog

export interface TypeToConfirm {
  textToMatch: string;
}

export interface ConfirmationCheckbox {
  label: string;
  default?: boolean;
}

export class ConfirmationDialogConfig {
  constructor(
    public title: string,
    public message: string | TypeToConfirm,
    public confirm = 'Ok',
    public critical = false,
    // Optional opt-in checkbox (e.g. "also delete related routes"). When
    // set, the dialog resolves with { checkboxChecked: boolean } instead
    // of plain `true` so the caller can read the user's choice.
    public checkbox?: ConfirmationCheckbox,
  ) { }
}
