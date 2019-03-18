import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { take } from 'rxjs/operators';

import { ConfirmationDialogConfig } from './confirmation-dialog.config';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';



@Injectable()
export class ConfirmationDialogService {

  constructor(private dialog: MatDialog) { }

  open(dialog: ConfirmationDialogConfig, doFn: (res?: any) => void): void {

    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      maxWidth: '400px',
      data: dialog
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result) {
        doFn(result);
      }
    });
  }
}
