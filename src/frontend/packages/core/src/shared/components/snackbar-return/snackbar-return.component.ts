import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';

import { RouterNav } from '@stratosui/store';
import { AppState } from '@stratosui/store';

@Component({
  selector: 'app-snackbar-return',
  templateUrl: './snackbar-return.component.html',
  styleUrls: ['./snackbar-return.component.scss']
})
export class SnackBarReturnComponent extends SimpleSnackBar {
  returnLabel: string;
  returnUrl: string;
  message: string;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private store: Store<AppState>,
    private snackRef: MatSnackBarRef<SimpleSnackBar>,
  ) {
    super(snackRef, data);
    this.returnLabel = data.returnLabel || 'Return';
    this.message = data.message;
    this.returnUrl = data.returnUrl;
  }

  return() {
    if (this.returnUrl) {
      this.store.dispatch(new RouterNav({ path: this.returnUrl }));
    }
    this.dismiss();
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
