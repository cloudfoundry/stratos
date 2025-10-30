import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Custom progress bar component using Tailwind CSS animations
 * Replaces Angular Material mat-progress-bar
 *
 * Supports three modes:
 * - indeterminate: Continuous sliding animation (default)
 * - determinate: Shows progress as a percentage (0-100)
 * - buffer: Shows buffering progress (not fully implemented yet)
 * - query: Shows a query animation
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full overflow-hidden"
         [class.h-1]="!customHeight"
         [style.height]="customHeight"
         role="progressbar"
         [attr.aria-valuenow]="mode === 'determinate' ? value : null"
         aria-valuemin="0"
         aria-valuemax="100">
      <!-- Background track -->
      <div class="absolute inset-0 bg-gray-200 dark:bg-gray-800"></div>

      <!-- Indeterminate animation (two bars for Material Design effect) -->
      <ng-container *ngIf="mode === 'indeterminate'">
        <!-- Secondary bar (darker, behind) -->
        <div class="absolute h-full animate-progress-indeterminate-secondary z-10"
             [ngClass]="progressBarSecondaryClass"></div>
        <!-- Primary bar (lighter, in front) -->
        <div class="absolute h-full animate-progress-indeterminate-primary z-20 opacity-70"
             [ngClass]="progressBarPrimaryClass"></div>
      </ng-container>

      <!-- Determinate progress -->
      <div *ngIf="mode === 'determinate'"
           class="absolute h-full transition-all duration-300 ease-out"
           [ngClass]="progressBarClass"
           [style.width.%]="value"></div>

      <!-- Query animation (reverse indeterminate) -->
      <div *ngIf="mode === 'query'"
           class="absolute h-full animate-progress-query"
           [ngClass]="progressBarClass"></div>

      <!-- Buffer mode (shows two bars) -->
      <ng-container *ngIf="mode === 'buffer'">
        <div class="absolute h-full transition-all duration-300 ease-out bg-gray-300"
             [style.width.%]="bufferValue"></div>
        <div class="absolute h-full transition-all duration-300 ease-out"
             [ngClass]="progressBarClass"
             [style.width.%]="value"></div>
      </ng-container>

      <!-- Solid mode (static bar at 100%) -->
      <div *ngIf="mode === 'solid'"
           class="absolute h-full"
           [ngClass]="progressBarClass"
           style="width: 100%"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Indeterminate primary animation (lighter bar) */
    @keyframes progress-indeterminate-primary {
      0% {
        left: -100%;
        width: 100%;
      }
      50% {
        left: 0%;
        width: 80%;
      }
      100% {
        left: 100%;
        width: 100%;
      }
    }

    /* Indeterminate secondary animation (darker bar, delayed) */
    @keyframes progress-indeterminate-secondary {
      0% {
        left: -150%;
        width: 100%;
      }
      50% {
        left: -20%;
        width: 150%;
      }
      100% {
        left: 100%;
        width: 100%;
      }
    }

    /* Query animation (reverse) */
    @keyframes progress-query {
      0% {
        right: -35%;
        width: 35%;
      }
      60% {
        right: 100%;
        width: 90%;
      }
      100% {
        right: 100%;
        width: 90%;
      }
    }

    .animate-progress-indeterminate-primary {
      animation: progress-indeterminate-primary 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .animate-progress-indeterminate-secondary {
      animation: progress-indeterminate-secondary 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      animation-delay: -0.5s;
    }

    .animate-progress-query {
      animation: progress-query 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
  `]
})
export class ProgressBarComponent implements OnInit, OnChanges {
  /**
   * Mode of the progress bar
   * - indeterminate: Continuous sliding animation (default)
   * - determinate: Shows progress percentage
   * - buffer: Shows buffer progress
   * - query: Shows query animation
   * - solid: Shows a solid bar at 100% (no animation)
   */
  @Input() mode: 'indeterminate' | 'determinate' | 'buffer' | 'query' | 'solid' = 'indeterminate';

  /**
   * Progress value (0-100) for determinate mode
   */
  @Input() value: number = 0;

  /**
   * Buffer value (0-100) for buffer mode
   */
  @Input() bufferValue: number = 0;

  /**
   * Color of the progress bar
   * - primary: Blue (default)
   * - accent: Cyan
   * - warn: Red
   */
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';

  /**
   * Optional custom height (CSS value like '2px', '4px', etc.)
   */
  @Input() customHeight?: string;

  /**
   * CSS classes for the progress bar based on color
   */
  progressBarClass: string = '';
  progressBarPrimaryClass: string = '';
  progressBarSecondaryClass: string = '';

  ngOnInit(): void {
    this.updateProgressBarClass();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color']) {
      this.updateProgressBarClass();
    }
  }

  /**
   * Update the CSS class for the progress bar based on color
   */
  private updateProgressBarClass(): void {
    switch (this.color) {
      case 'primary':
        this.progressBarClass = 'bg-brand-500';
        this.progressBarPrimaryClass = 'bg-brand-400';  // Lighter blue
        this.progressBarSecondaryClass = 'bg-brand-600'; // Darker blue
        break;
      case 'accent':
        this.progressBarClass = 'bg-accent-shade-500';
        this.progressBarPrimaryClass = 'bg-accent-shade-400';
        this.progressBarSecondaryClass = 'bg-accent-shade-600';
        break;
      case 'warn':
        this.progressBarClass = 'bg-danger-shade-500';
        this.progressBarPrimaryClass = 'bg-danger-shade-400';
        this.progressBarSecondaryClass = 'bg-danger-shade-600';
        break;
      default:
        this.progressBarClass = 'bg-brand-500';
        this.progressBarPrimaryClass = 'bg-brand-400';
        this.progressBarSecondaryClass = 'bg-brand-600';
    }
  }
}
