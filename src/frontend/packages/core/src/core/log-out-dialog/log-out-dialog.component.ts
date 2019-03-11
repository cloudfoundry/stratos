import { Component, OnInit, Inject, OnDestroy, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppState } from '../../../../store/src/app-state';
import { Logout } from '../../../../store/src/actions/auth.actions';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  styleUrls: ['./log-out-dialog.component.scss']
})
export class LogOutDialogComponent implements OnInit, OnDestroy {
  constructor(
    public dialogRef: MatDialogRef<LogOutDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<AppState>) { }

  private _autoLogout: Subscription;
  public countDown: number;
  public countdownTotal: number;
  public percentage = 0;

  ngOnInit() {
    const updateInterval = 500;
    this.countdownTotal = this.countDown = this.data.expiryDate - Date.now();
    this._autoLogout = interval(updateInterval)
      .pipe(
        tap(() => {
          if (this.countDown <= 0) {
            this._autoLogout.unsubscribe();
            this.store.dispatch(new Logout());
          } else {
            this.countDown -= updateInterval;
            this.percentage = ((this.countdownTotal - this.countDown) / this.countdownTotal) * 100;
          }
        })
      ).subscribe();
  }

  ngOnDestroy() {
    this.percentage = 0;
    this._autoLogout.unsubscribe();
  }

}
