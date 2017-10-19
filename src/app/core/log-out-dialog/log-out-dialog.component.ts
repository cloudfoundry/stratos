import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { Logout } from '../../store/actions/auth.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  styleUrls: ['./log-out-dialog.component.scss']
})
export class LogOutDialogComponent implements OnInit, OnDestroy {

  constructor(
    public dialogRef: MdDialogRef<LogOutDialogComponent>,
    @Inject(MD_DIALOG_DATA) public data: any,
    private store: Store<AppState>) { }

  private _autoLogout: any;
  private countDown: number;

  ngOnInit() {
    const updateInterval = 1000;
    this.countDown = this.data.expiryDate - Date.now();
    // this.countDown = 5000; // REMOVE
    this._autoLogout = setInterval(() => {
      if (this.countDown <= 0) {
        this.store.dispatch(new Logout());
      } else {
        this.countDown -= updateInterval;
      }
    }, updateInterval);
  }

  ngOnDestroy(): void {
    clearInterval(this._autoLogout);
  }

}
