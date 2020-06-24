import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

import { SnackBarReturnComponent } from '../components/snackbar-return/snackbar-return.component';

/**
 * Servicve for showing snackbars
 */
@Injectable({
  providedIn: 'root',
})
export class SnackBarService {

  constructor(public snackBar: MatSnackBar) {}

  private snackBars: MatSnackBarRef<SimpleSnackBar>[] = [];

  public show(message: string, closeMessage?: string, duration: number = 5000) {
    this.snackBars.push(this.snackBar.open(message, closeMessage, {
      duration: closeMessage ? null :duration
    }));
  }

  public showReturn(message: string, returnUrl: string, returnLabel: string) {
    this.snackBars.push(this.snackBar.openFromComponent(SnackBarReturnComponent, {
      data: { message, returnUrl, returnLabel }
    }));
  }

  public hide() {
    this.snackBars.forEach(snackBar => snackBar.dismiss());
  }
}
