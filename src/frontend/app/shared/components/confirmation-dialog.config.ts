// Configuration for a confirmation dialog
export class ConfirmationDialogConfig {
  constructor(
    public title: string,
    public msg: string,
    public confirm = 'Ok',
    public critical = false,
    public typeToConfirm: {
      message: string,
      label: string,
      textToMatch: string
    } = null) { }
}
