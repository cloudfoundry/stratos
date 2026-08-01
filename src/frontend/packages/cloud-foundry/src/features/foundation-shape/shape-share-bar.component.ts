import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface SharePart {
  label: string;
  value: number;
}

/**
 * Part-to-whole share bar: every part is a pronounced fill and together the
 * segments always cover 100% of the track — the bar never reads as a lone
 * value on an empty gauge. Color follows the part's position in the input
 * (never its rank), and identity is always carried by the caption text with
 * each part's own percentage, never by color alone.
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
        <div class="flex h-3 gap-[2px]">
          @for (segment of segments(); track segment.label) {
            <div class="rounded min-w-[3px]" [class]="segment.colorClass" [style.width.%]="segment.pct"
              [title]="segment.label + ' ' + segment.value + ' (' + segment.pctLabel + ')'"></div>
          }
        </div>
        <div class="text-xs text-content-muted">
          @for (segment of segments(); track segment.label; let last = $last) {
            <span>{{ segment.label }} {{ segment.value | number }} ({{ segment.pctLabel }})@if (!last) { &nbsp;·&nbsp; }</span>
          }
        </div>
      } @else {
        <div class="text-xs text-content-muted">no data</div>
      }
    </div>
  `,
})
export class ShapeShareBarComponent {
  label = input.required<string>();
  parts = input.required<SharePart[]>();

  /** Fixed position→color mapping; a part keeps its color as others come and go. */
  private static readonly COLORS = [
    'bg-[#2a78d6] dark:bg-[#3987e5]',
    'bg-[#94a3b8] dark:bg-[#64748b]',
    'bg-[#0d9488] dark:bg-[#14b8a6]',
    'bg-[#d97706] dark:bg-[#f59e0b]',
  ];

  readonly total = computed(() => this.parts().reduce((sum, part) => sum + part.value, 0));

  readonly segments = computed(() => {
    const total = this.total();
    return this.parts()
      .map((part, index) => {
        const pct = total > 0 ? (part.value / total) * 100 : 0;
        return {
          ...part,
          pct,
          pctLabel: pct > 0 && pct < 0.1 ? '<0.1%' : `${pct.toFixed(1)}%`,
          colorClass: ShapeShareBarComponent.COLORS[index % ShapeShareBarComponent.COLORS.length],
        };
      })
      .filter(segment => segment.value > 0);
  });
}
