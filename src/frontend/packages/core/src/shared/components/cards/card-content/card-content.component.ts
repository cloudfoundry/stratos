import { Component } from '@angular/core';

/**
 * Card content component using Tailwind CSS
 * Provides consistent content padding and styling
 */
@Component({
  selector: 'app-card-content',
  standalone: true,
  template: `
    <div class="px-6 py-4">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardContentComponent {}
