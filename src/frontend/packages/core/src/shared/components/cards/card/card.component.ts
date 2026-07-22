import { ChangeDetectionStrategy, Component  } from '@angular/core';

/**
 * Simple card wrapper component using Tailwind CSS
 * Provides semantic structure for card-based layouts
 */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-wrapper border border-[color:var(--card-border)] rounded">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .card-wrapper {
      width: 100%;
      height: 100%;
    }
  `]
})
export class CardWrapperComponent {}
