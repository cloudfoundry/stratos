import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';
import { ConfirmationDialogConfig } from './confirmation-dialog.config';


@Injectable()
export class ConfirmationDialogService {

  constructor(private dialog: MatDialog) { }

  open(dialog: ConfirmationDialogConfig, doFn: Function): void {

    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      maxWidth: '400px',
      data: dialog
    });

    dialogRef.afterClosed().take(1).subscribe(result => {
      if (result) {
        doFn(result);
      }
    });
  }
}
