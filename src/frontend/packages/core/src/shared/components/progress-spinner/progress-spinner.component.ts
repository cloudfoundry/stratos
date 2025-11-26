import { ChangeDetectionStrategy, Component, Input, type OnInit, type OnChanges, type SimpleChanges  } from '@angular/core';


/**
 * Custom progress spinner component using Tailwind CSS animations
 * Replaces Angular Material mat-progress-spinner
 *
 * Supports two modes:
 * - indeterminate: Continuous spinning animation (default)
 * - determinate: Shows progress as a percentage (0-100)
 */
@Component({
  selector: 'app-progress-spinner',
  standalone: true,
  imports: [],
  template: `
    <div class="inline-flex items-center justify-center" [style.width.px]="diameter" [style.height.px]="diameter">
      <!-- Indeterminate spinner (continuous rotation) -->
      @if (mode === 'indeterminate') {
        <div
          class="rounded-full border-solid border-current border-r-transparent animate-spin"
          [style.width.px]="diameter"
          [style.height.px]="diameter"
          [style.border-width.px]="strokeWidth"
          [attr.aria-label]="'Loading...'"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100">
        </div>,
  changeDetection: ChangeDetectionStrategy.OnPush
})
    
      <!-- Determinate spinner (arc showing progress) -->
      @if (mode === 'determinate') {
        <svg
          class="transform -rotate-90"
          [attr.width]="diameter"
          [attr.height]="diameter"
          [attr.viewBox]="'0 0 ' + diameter + ' ' + diameter"
          role="progressbar"
          [attr.aria-valuenow]="value"
          aria-valuemin="0"
          aria-valuemax="100">
          <!-- Background circle -->
          <circle
            [attr.cx]="diameter / 2"
            [attr.cy]="diameter / 2"
            [attr.r]="radius"
            fill="none"
            class="stroke-gray-200"
            [attr.stroke-width]="strokeWidth">
          </circle>
          <!-- Progress arc -->
          <circle
            [attr.cx]="diameter / 2"
            [attr.cy]="diameter / 2"
            [attr.r]="radius"
            fill="none"
            class="stroke-current transition-all duration-300"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset"
            stroke-linecap="round">
          </circle>
        </svg>
      }
    </div>
    `,
  styles: [`
    :host {
      display: inline-block;
      color: var(--color-primary, #2196f3);
    }
  `]
})
export class ProgressSpinnerComponent implements OnInit, OnChanges {
  /**
   * Mode of the spinner
   * - indeterminate: Continuous spinning (default)
   * - determinate: Shows progress percentage
   */
  @Input() mode: 'indeterminate' | 'determinate' = 'indeterminate';

  /**
   * Diameter of the spinner in pixels
   * Default: 40px (matches Material default)
   */
  @Input() diameter: number = 40;

  /**
   * Progress value (0-100) for determinate mode
   */
  @Input() value: number = 0;

  /**
   * Color of the spinner (optional, uses currentColor by default)
   */
  @Input() color?: 'primary' | 'accent' | 'warn';

  /**
   * Stroke width of the spinner circle
   * Automatically calculated based on diameter
   */
  strokeWidth: number = 4;

  /**
   * Radius of the progress circle
   * Calculated: (diameter - strokeWidth) / 2
   */
  radius: number = 0;

  /**
   * Circumference of the circle
   * Calculated: 2 * π * radius
   */
  circumference: number = 0;

  /**
   * Dash offset for the progress arc
   * Controls how much of the circle is visible
   */
  dashOffset: number = 0;

  ngOnInit(): void {
    // Calculate stroke width based on diameter (similar to Material)
    this.strokeWidth = Math.max(2, Math.round(this.diameter / 10));

    // Calculate radius and circumference for determinate mode
    this.radius = (this.diameter - this.strokeWidth) / 2;
    this.circumference = 2 * Math.PI * this.radius;

    // Update dash offset when value changes
    this.updateDashOffset();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value || changes.mode) {
      this.updateDashOffset();
    }
  }

  /**
   * Update the dash offset based on the current value
   * dashOffset = circumference * (1 - value / 100)
   */
  private updateDashOffset(): void {
    if (this.mode === 'determinate') {
      const progress = Math.max(0, Math.min(100, this.value));
      this.dashOffset = this.circumference * (1 - progress / 100);
    }
  }
}

/**
 * Alias component for mat-spinner (always indeterminate mode)
 * This is an Angular Material convention where mat-spinner is a shorthand
 * for mat-progress-spinner with mode="indeterminate"
 */
@Component({
  selector: 'mat-spinner',
  standalone: true,
  imports: [ProgressSpinnerComponent],
  template: `<app-progress-spinner [diameter]="diameter" [color]="color" mode="indeterminate"></app-progress-spinner>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatSpinnerComponent {
  @Input() diameter: number = 40;
  @Input() color?: 'primary' | 'accent' | 'warn';
}
