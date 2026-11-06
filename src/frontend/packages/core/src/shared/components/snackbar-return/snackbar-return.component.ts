import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { TailwindSnackBarRef } from '../../services/tailwind-snackbar.service';
import { MAT_SNACK_BAR_DATA, SimpleSnackBar } from '../../../shared/services/tailwind-material-replacements';

@Component({
  selector: 'app-snackbar-return',
  templateUrl: './snackbar-return.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackBarReturnComponent extends SimpleSnackBar {
  data: any;
  private router = inject(Router);
  private snackRef: TailwindSnackBarRef<any>;

  returnLabel: string;
  returnUrl: string;
  message: string;

  constructor() {
    const data = inject(MAT_SNACK_BAR_DATA);
    const snackRef = inject<TailwindSnackBarRef<any>>('TailwindSnackBarRef' as any);

    super(snackRef, data);
    this.data = data;
    this.snackRef = snackRef;

    this.returnLabel = data.returnLabel || 'Return';
    this.message = data.message;
    this.returnUrl = data.returnUrl;
  }

  return() {
    if (this.returnUrl) {
      this.router.navigate(this.returnUrl.split('/'));
    }
    this.dismiss();
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
