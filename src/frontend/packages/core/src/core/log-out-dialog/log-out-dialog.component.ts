import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { MAT_DIALOG_DATA } from '../../shared/services/tailwind-material-replacements';
import { TailwindDialogRef } from '../../shared/services/tailwind-dialog.service';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppProgressBarComponent } from '../../shared/components/progress-bar/app-progress-bar.component';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  standalone: true,
  imports: [
    AppProgressBarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogOutDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject<TailwindDialogRef<LogOutDialogComponent>>('TailwindDialogRef' as any);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);


  private autoLogout!: Subscription;
  private countDown!: number;
  private countdownTotal!: number;
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
            this.router.navigate(['/login/logout']);
            this.dialogRef.close(false);
          } else {
            this.percentage = ((this.countdownTotal - this.countDown) / this.countdownTotal) * 100;
            this.cdr.markForCheck();
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
