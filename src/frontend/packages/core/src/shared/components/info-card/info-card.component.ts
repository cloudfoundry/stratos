import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-info-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border border-content-border rounded-lg overflow-hidden">
      @if (title) {
        <div class="bg-card-header-bg px-4 py-2.5 border-b border-content-border">
          <span class="text-xs font-semibold uppercase tracking-wider text-content-muted">{{ title }}</span>
        </div>
      }
      <div class="py-3">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class InfoCardComponent {
  @Input() title: string;
}
