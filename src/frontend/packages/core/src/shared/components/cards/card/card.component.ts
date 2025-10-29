import { Component } from '@angular/core';

/**
 * Simple card wrapper component using Tailwind CSS
 * Provides semantic structure for card-based layouts
 */
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardWrapperComponent {}
