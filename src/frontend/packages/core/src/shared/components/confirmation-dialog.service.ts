import { Injectable, inject } from '@angular/core';
import { TailwindDialogService } from '../services/tailwind-dialog.service';
import { take } from 'rxjs/operators';

import type { ConfirmationDialogConfig } from './confirmation-dialog.config';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  private dialog = inject(TailwindDialogService);

  open(dialog: ConfirmationDialogConfig, doFn: (res?: unknown) => void): void {
    this.openWithCancel(dialog, doFn, () => {
      // No-op on cancel
    });
  }

  // Open the dialog and report back to the function for both okay and cancel
  openWithCancel(dialog: ConfirmationDialogConfig, doFn: (res?: unknown) => void, cancelFn: (res?: unknown) => void): void {

    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      maxWidth: '400px',
      data: dialog
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result) {
        doFn(result);
      } else {
        cancelFn();
      }
    });
  }

}
