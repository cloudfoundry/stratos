import { ChangeDetectionStrategy, Component, Inject  } from '@angular/core';

import { TailwindSnackBarRef } from '../../services/tailwind-snackbar.service';
import { MAT_SNACK_BAR_DATA, SimpleSnackBar } from '../../../shared/services/tailwind-material-replacements';
import { Store } from '@ngrx/store';
import { RouterNav, AppState } from '@stratosui/store';

@Component({
  selector: 'app-snackbar-return',
  templateUrl: './snackbar-return.component.html',
  styleUrls: ['./snackbar-return.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackBarReturnComponent extends SimpleSnackBar {
  returnLabel: string;
  returnUrl: string;
  message: string;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private store: Store<AppState>,
    @Inject('TailwindSnackBarRef') private snackRef: TailwindSnackBarRef<any>,
  ) {
    super(snackRef, data);
    this.returnLabel = data.returnLabel || 'Return';
    this.message = data.message;
    this.returnUrl = data.returnUrl;
  }

  return() {
    if (this.returnUrl) {
      this.store.dispatch(new RouterNav({ path: this.returnUrl });
    }
    this.dismiss();
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
