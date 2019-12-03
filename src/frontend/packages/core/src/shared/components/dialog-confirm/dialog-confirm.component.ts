import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { environment } from '../../../environments/environment';
import { ConfirmationDialogConfig, TypeToConfirm } from '../confirmation-dialog.config';

@Component({
  selector: 'app-dialog-confirm',
  templateUrl: './dialog-confirm.component.html',
  styleUrls: ['./dialog-confirm.component.scss']
})
export class DialogConfirmComponent {
  public textToMatch: string;

  constructor(
    public dialogRef: MatDialogRef<DialogConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig
  ) {
    const typeToConfirm = data.message as TypeToConfirm;
    if (typeToConfirm && typeToConfirm.textToMatch) {
      this.textToMatch = typeToConfirm.textToMatch;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handlePaste($event) {
    if (environment.production) {
      $event.preventDefault();
    }
  }

}
