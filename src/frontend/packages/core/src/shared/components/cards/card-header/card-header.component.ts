import { ChangeDetectionStrategy, Component  } from '@angular/core';

/**
 * Card header component using Tailwind CSS
 * Provides consistent header styling for cards
 */
@Component({
  selector: 'app-card-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardHeaderComponent {}
