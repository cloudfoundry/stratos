import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar, TextOnlySnackBar } from '@angular/material/snack-bar';
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
  // If forceDuration is supplied then regardless of closeMessage the duration is used
  public show(message: string, closeMessage?: string, duration = 5000, forceDuration = false): MatSnackBarRef<TextOnlySnackBar> {
    const snackbarRef = this.snackBar.open(message, closeMessage, {
      duration: forceDuration ? duration : closeMessage ? null : duration
    });
    this.trackSnackBar(snackbarRef);
    return snackbarRef;
  }

  // Show a snack bar with the given message and en extra button which when clicked navigates to the given URL
  // A 'Dismiss' button is also always included in the snack bar
  // The snack bar will disappear after the given duration if this is specified
  public showWithLink(
    message: string,
    returnUrl: string | string[],
    returnLabel: string,
    duration?: number): MatSnackBarRef<SnackBarReturnComponent> {
    const snackbarRef = this.snackBar.openFromComponent(SnackBarReturnComponent, {
      duration,
      data: {
        message,
        returnUrl,
        returnLabel,
      }
    });
    this.trackSnackBar(snackbarRef);
    return snackbarRef;
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
