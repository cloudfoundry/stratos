import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Card header component using Tailwind CSS
 * Provides consistent header styling for cards: the shaded band of the
 * global `.card-header` class, or no band with `plain`.
 */
@Component({
  selector: 'app-card-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between"
      [style.background-color]="plain() ? null : 'var(--card-header-bg)'">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardHeaderComponent {
  readonly plain = input(false, { transform: booleanAttribute });
}
