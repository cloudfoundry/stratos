import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  styleUrls: ['./log-out-dialog.component.scss']
})
export class LogOutDialogComponent implements OnInit, OnDestroy {

  constructor(public dialogRef: MdDialogRef<LogOutDialogComponent>,
    @Inject(MD_DIALOG_DATA) public data: any) { }

  private _autoLogout: any;
  private countDown: number;

  ngOnInit() {
    const updateInterval = 1000;
    this.countDown = this.data.expiryDate - Date.now();
    this.countDown = 5000;//TODO RC REMOVE ME
    this._autoLogout = setInterval(() => {
      this.countDown -= updateInterval;
      if (this.countDown < 0) {
        this.dialogRef.close(false);
      }
    }, updateInterval);
  }

  ngOnDestroy(): void {
    clearInterval(this._autoLogout);
  }

}
