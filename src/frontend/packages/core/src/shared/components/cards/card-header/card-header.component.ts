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
    <div class="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
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
