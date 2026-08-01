import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface SharePart {
  label: string;
  value: number;
}

/**
 * Part-to-whole share bar: the primary part carries the data hue, the
 * remainder stays recessive (muted surface) so an "empty" share reads as
 * background, not as a competing series. Identity is carried by the caption
 * text, never by color alone.
 */
@Component({
  selector: 'app-shape-share-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col gap-1">
      <div class="text-xs font-semibold uppercase tracking-wider text-content-muted">{{ label() }}</div>
      @if (total() > 0) {
        <div class="flex h-3 gap-[2px]" [title]="caption()">
          @if (primary().value > 0) {
            <div class="rounded bg-[#2a78d6] dark:bg-[#3987e5] min-w-[2px]" [style.width.%]="primaryPct()"></div>
          }
          @if (remainder().value > 0) {
            <div class="rounded bg-content-secondary border border-content-border min-w-[2px]" [style.width.%]="100 - primaryPct()"></div>
          }
        </div>
        <div class="text-xs text-content-muted">
          {{ primary().label }} {{ primary().value | number }} ·
          {{ remainder().label }} {{ remainder().value | number }}
          ({{ pctLabel() }} {{ primary().label }})
        </div>
      } @else {
        <div class="text-xs text-content-muted">no data</div>
      }
    </div>
  `,
})
export class ShapeShareBarComponent {
  label = input.required<string>();
  primary = input.required<SharePart>();
  remainder = input.required<SharePart>();

  readonly total = computed(() => this.primary().value + this.remainder().value);

  readonly primaryPct = computed(() => (this.total() > 0 ? (this.primary().value / this.total()) * 100 : 0));

  readonly pctLabel = computed(() => {
    const pct = this.primaryPct();
    return pct > 0 && pct < 0.1 ? '<0.1%' : `${pct.toFixed(1)}%`;
  });

  caption(): string {
    return `${this.primary().label} ${this.primary().value} · ${this.remainder().label} ${this.remainder().value}`;
  }
}
