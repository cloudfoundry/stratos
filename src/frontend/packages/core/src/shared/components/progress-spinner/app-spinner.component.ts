import { Component, Input } from '@angular/core';
import { ProgressSpinnerComponent } from './progress-spinner.component';

/**
 * Application spinner component (alias for indeterminate mode)
 * This component provides a simple spinner interface using the custom Tailwind-based spinner.
 * It's compatible with mat-spinner API for easy migration.
 *
 * Usage:
 * <app-spinner></app-spinner>
 * <app-spinner [diameter]="20"></app-spinner>
 * <app-spinner [diameter]="30" color="accent"></app-spinner>
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [ProgressSpinnerComponent],
  template: `<app-progress-spinner [diameter]="diameter" [color]="color" mode="indeterminate"></app-progress-spinner>`
})
export class AppSpinnerComponent {
  /**
   * Diameter of the spinner in pixels
   * Default: 40px (matches Material default)
   */
  @Input() diameter: number = 40;

  /**
   * Color of the spinner (optional, uses currentColor by default)
   */
  @Input() color?: 'primary' | 'accent' | 'warn';
}
