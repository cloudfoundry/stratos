import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '../../shared/services/tailwind-material-replacements';
import { TailwindDialogRef } from '../../shared/services/tailwind-dialog.service';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-log-out-dialog',
  templateUrl: './log-out-dialog.component.html',
  styleUrls: ['./log-out-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule
  ]
})
export class LogOutDialogComponent implements OnInit, OnDestroy {
  constructor(
    @Inject('TailwindDialogRef') public dialogRef: TailwindDialogRef<LogOutDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router
  ) { }

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
            this.router.navigate(['/login/logout']);
            this.dialogRef.close(false);
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
