// Configuration for a confirmation dialog

export interface TypeToConfirm {
  textToMatch: string;
}
export class ConfirmationDialogConfig {
  constructor(
    public title: string,
    public message: string | TypeToConfirm,
    public confirm = 'Ok',
    public critical = false
  ) { }
}
