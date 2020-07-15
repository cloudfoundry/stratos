import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { ElectronService } from 'ngx-electron';

import { SnackBarReturnComponent } from '../components/snackbar-return/snackbar-return.component';

/**
 * Service for showing snackbars
 */
@Injectable({
  providedIn: 'root',
})
export class SnackBarService {

  static ELECTRON_NOTIFICATION = 'ELECTRON_NOTIFICATION'

  constructor(
    public snackBar: MatSnackBar,
    private electronService: ElectronService
  ) { }

  private snackBars: MatSnackBarRef<SimpleSnackBar>[] = [];

  public show(message: string, closeMessage?: string, duration: number = 5000) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('ELECTRON_NOTIFICATION', {
        message,
      });
    } else {
      this.snackBars.push(this.snackBar.open(message, closeMessage, {
        duration: closeMessage ? null : duration
      }));
    }
  }

  public showReturn(message: string, returnUrl: string, returnLabel: string) {
    if (this.electronService.isElectronApp) {
      this.show(message);
    } else {
      this.snackBars.push(this.snackBar.openFromComponent(SnackBarReturnComponent, {
        data: { message, returnUrl, returnLabel }
      }));
    }
  }

  public hide() {
    this.snackBars.forEach(snackBar => snackBar.dismiss());
  }
}
