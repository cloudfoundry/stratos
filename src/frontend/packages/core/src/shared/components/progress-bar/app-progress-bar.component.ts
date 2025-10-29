import { Component } from '@angular/core';
import { ProgressBarComponent } from './progress-bar.component';

/**
 * Alias component for app-progress-bar selector
 * Provides the same functionality as ProgressBarComponent but with app-progress-bar selector
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [ProgressBarComponent],
  template: `
    <mat-progress-bar
      [mode]="mode"
      [value]="value"
      [bufferValue]="bufferValue"
      [color]="color"
      [customHeight]="customHeight">
    </mat-progress-bar>
  `
})
export class AppProgressBarComponent extends ProgressBarComponent {
}
