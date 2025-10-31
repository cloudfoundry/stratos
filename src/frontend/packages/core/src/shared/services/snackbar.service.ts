import { Injectable, inject } from '@angular/core';
import { first } from 'rxjs/operators';

import { SnackBarReturnComponent } from '../components/snackbar-return/snackbar-return.component';
import { TailwindSnackBarService, TailwindSnackBarRef } from './tailwind-snackbar.service';

/**
 * Service for showing snackbars
 *
 * Note: Only one snack bar is shown at a given time
 */
@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private snackBars: TailwindSnackBarRef<any>[] = [];

  public snackBar = inject(TailwindSnackBarService);

  // Show a snack bar with the given message
  // If closeMessage is supplied a button to dismiss the snack bar is shown and the duration is ignored
  // If closeMessage is not supplied, no close button is shown and the snack bar will hide after the specified duration (default 5s)
  // If forceDuration is supplied then regardless of closeMessage the duration is used
  public show(message: string, closeMessage?: string, duration = 5000, forceDuration = false): TailwindSnackBarRef<any> {
    const snackbarRef = this.snackBar.open(message, closeMessage, {
      duration: forceDuration ? duration : (closeMessage ? 0 : duration)
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
    duration?: number): TailwindSnackBarRef<any> {
    // For now, use simple snackbar - can be enhanced later for component support
    const fullMessage = `${message} - ${returnLabel}`;
    const snackbarRef = this.snackBar.open(fullMessage, 'Dismiss', {
      duration: duration || 0
    });
    this.trackSnackBar(snackbarRef);
    return snackbarRef;
  }

  // Hide the open snack bars
  public hide() {
    this.snackBars.forEach(snackBar => snackBar.dismiss());
  }

  private trackSnackBar(snackBar: TailwindSnackBarRef<any>) {
    this.snackBars.push(snackBar);
    snackBar.afterDismissed().pipe(first()).subscribe(() => this.snackBars.shift());
  }
}
