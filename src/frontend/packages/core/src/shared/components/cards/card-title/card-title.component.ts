import { Component } from '@angular/core';

/**
 * Card title component using Tailwind CSS
 * Provides consistent title styling for card headers
 */
@Component({
  selector: 'app-card-title',
  standalone: true,
  template: `
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
      <ng-content></ng-content>
    </h3>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardTitleComponent {}
