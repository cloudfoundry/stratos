import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { first } from 'rxjs/operators';

import { SnackBarReturnComponent } from '../components/snackbar-return/snackbar-return.component';

/**
 * Service for showing snackbars
 *
 * Note: Only one snack bar is shown at a given time
 */
@Injectable({
  providedIn: 'root',
})
export class SnackBarService {

  private snackBars: MatSnackBarRef<SimpleSnackBar>[] = [];

  constructor(public snackBar: MatSnackBar) { }

  // Show a snack bar with the given message
  // If closeMessage is supplied a button to dismiss the snack bar is shown and the duration is ignored
  // If closeMessage is not supplied, no close button is shown and the snack bar will hide after the specified duration (default 5s)
  public show(message: string, closeMessage?: string, duration: number = 5000) {
    this.trackSnackBar(this.snackBar.open(message, closeMessage, {
      duration: closeMessage ? null : duration
    }));
  }

  // Show a snack bar with the given message and en extra button which when clicked navigates to the given URL
  // A 'Dismiss' button is also always included in the snack bar
  // The snack bar will disappear after the given duration if this is specified
  public showWithLink(message: string, returnUrl: string | string[], returnLabel: string, duration?: number) {
    this.trackSnackBar(this.snackBar.openFromComponent(SnackBarReturnComponent, {
      duration,
      data: {
        message,
        returnUrl,
        returnLabel,
      }
    }));
  }

  // Hide the open snack bars
  public hide() {
    this.snackBars.forEach(snackBar => snackBar.dismiss());
  }

  private trackSnackBar(snackBar: MatSnackBarRef<SimpleSnackBar>) {
    this.snackBars.push(snackBar);
    snackBar.afterDismissed().pipe(first()).subscribe(() => this.snackBars.shift());
  }
}
