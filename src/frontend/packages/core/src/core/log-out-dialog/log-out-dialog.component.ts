import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Logout } from '../../../../store/src/actions/auth.actions';
import { GeneralEntityAppState } from '../../../../store/src/app-state';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  styleUrls: ['./log-out-dialog.component.scss']
})
export class LogOutDialogComponent implements OnInit, OnDestroy {
  constructor(
    public dialogRef: MatDialogRef<LogOutDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<GeneralEntityAppState>) { }

  private autoLogout: Subscription;
  private countDown: number;
  private countdownTotal: number;
  public percentage = 0;

  ngOnInit() {
    const updateInterval = 500;
    this.countdownTotal = this.calcCountdown();
    this.autoLogout = interval(updateInterval)
      .pipe(
        tap(() => {
          // Recalculate this every time, as `interval` slows down when tab not focused
          this.countDown = this.calcCountdown();
          if (this.countDown <= 0) {
            this.autoLogout.unsubscribe();
            this.store.dispatch(new Logout());
          } else {
            this.percentage = ((this.countdownTotal - this.countDown) / this.countdownTotal) * 100;
          }
        })
      ).subscribe();
  }

  ngOnDestroy() {
    this.percentage = 0;
    this.autoLogout.unsubscribe();
  }

  private calcCountdown(): number {
    return this.data.expiryDate - Date.now();
  }
}
