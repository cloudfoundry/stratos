import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';


// Configuration for a confirmation dialog
export class ConfirmationDialog {
  constructor(public title: string, public message: string, public confirmButton?: string) {
    this.confirmButton = this.confirmButton || 'Ok';
  }
}

@Injectable()
export class ConfirmationDialogService {

  constructor(private dialog: MatDialog) {}

  open(dialog: ConfirmationDialog, doFn: Function): void {

    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      maxWidth: '400px',
      data: { title: dialog.title, msg: dialog.message, confirm: dialog.confirmButton }
    });

    dialogRef.afterClosed().take(1).subscribe(result => {
      if (result) {
        doFn(result);
      }
    });
  }
}
