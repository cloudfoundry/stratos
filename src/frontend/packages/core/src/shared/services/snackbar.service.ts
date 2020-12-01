import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { first } from 'rxjs/operators';

import { SnackBarReturnComponent } from '../components/snackbar-return/snackbar-return.component';

/**
 * Service for showing snackbars
 */
@Injectable({
  providedIn: 'root',
})
export class SnackBarService {

  constructor(public snackBar: MatSnackBar) { }

  // There can onlly be one snackbar on screen at once
  private lastSnackBar: MatSnackBarRef<SimpleSnackBar>;

  public show(message: string, closeMessage?: string, duration: number = 5000) {
    this.trackSnackBar(this.snackBar.open(message, closeMessage, {
      duration: closeMessage ? null : duration
    }));
  }

  public showReturn(message: string, returnUrl: string | string[], returnLabel: string, duration?: number) {
    this.trackSnackBar(this.snackBar.openFromComponent(SnackBarReturnComponent, {
      duration,
      data: {
        message,
        returnUrl,
        returnLabel,
      }
    }));
  }

  public hide() {
    if (this.lastSnackBar) {
      this.lastSnackBar.dismiss();
    }
  }

  private trackSnackBar(snackBar: MatSnackBarRef<SimpleSnackBar>) {
    this.lastSnackBar = snackBar;
    snackBar.afterDismissed().pipe(first()).subscribe(() => this.lastSnackBar = null);
  }
}
