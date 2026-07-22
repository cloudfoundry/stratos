import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { estimateFootprint, formatBytes, HeapInfo } from '../diagnostics-data/entity-footprint';

/** Fixed slot order for meter segments (matches the counts-page probe order). */
const METER_SLOTS: { key: string; label: string }[] = [
  { key: 'user', label: 'Users' },
  { key: 'organization', label: 'Organizations' },
  { key: 'space', label: 'Spaces' },
  { key: 'application', label: 'Applications' },
  { key: 'route', label: 'Routes' },
  { key: 'serviceInstance', label: 'Service Instances' },
];

/**
 * Smallest rendered width (percent of track) for a non-zero segment, so a
 * sliver stays visible next to the 2px surface gaps between segments.
 */
export const MIN_SEGMENT_PERCENT = 0.75;

export interface MeterSegment {
  key: string;
  label: string;
  /** Estimated retained bytes (count x ENTITY_BYTES x safety factor). */
  bytes: number;
  /** Rendered width as percent of the track, floored/clamped. */
  percent: number;
}

export interface MeterThreshold {
  percent: number;
  label: 'warn' | 'high';
}

/**
 * Track budget in bytes: with a real heap reading the track represents
 * 0.8 x limit (the denominator rateRisk uses); with the fixed budget the
 * track is the budget itself.
 */
export function meterBudget(heap: HeapInfo): number {
  return heap.usedBytes !== null ? 0.8 * heap.limitBytes : heap.limitBytes;
}

/**
 * Zone boundary positions matching the rateRisk thresholds: low/medium at
 * 50%, medium/high at 75% of the real-heap track; 25% and 50% of the
 * fixed-budget track.
 */
export function thresholdPositions(heap: HeapInfo): MeterThreshold[] {
  return heap.usedBytes !== null
    ? [{ percent: 50, label: 'warn' }, { percent: 75, label: 'high' }]
    : [{ percent: 25, label: 'warn' }, { percent: 50, label: 'high' }];
}

/**
 * Turn per-entity counts + heap info into meter geometry: an optional
 * leading "in use" percentage, one segment per non-zero known entity in
 * fixed slot order, and an overflow flag when the combined footprint does
 * not fit the budget. Cumulative rendered width never exceeds 100%;
 * clamped-out segments stay in the list (width 0) so the legend can still
 * name them.
 */
export function computeSegments(
  counts: Record<string, number | null | undefined>,
  heap: HeapInfo
): { usedPercent: number | null; segments: MeterSegment[]; overflow: boolean } {
  const budget = meterBudget(heap);
  const usedPercent = heap.usedBytes !== null
    ? Math.min((heap.usedBytes / budget) * 100, 100)
    : null;

  let remaining = 100 - (usedPercent ?? 0);
  let totalBytes = 0;
  const segments: MeterSegment[] = [];
  for (const slot of METER_SLOTS) {
    const count = counts[slot.key];
    if (typeof count !== 'number' || count <= 0) {
      continue;
    }
    const bytes = estimateFootprint({ [slot.key]: count });
    totalBytes += bytes;
    const wanted = Math.max((bytes / budget) * 100, MIN_SEGMENT_PERCENT);
    const percent = Math.min(wanted, remaining);
    remaining -= percent;
    segments.push({ key: slot.key, label: slot.label, bytes, percent });
  }

  const overflow = (heap.usedBytes ?? 0) + totalBytes > budget;
  return { usedPercent, segments, overflow };
}

/**
 * Horizontal stacked heap-headroom meter for one endpoint: current heap
 * usage (when known) plus the estimated footprint of each entity type,
 * against the same budget and thresholds rateRisk rates against.
 */
@Component({
  selector: 'app-heap-headroom-meter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1.5">
      <div class="relative flex h-4 w-full overflow-hidden rounded bg-content-secondary"
        role="img" [attr.aria-label]="ariaLabel()">
        @if (model().usedPercent !== null) {
          <div class="meter-fill fill-used" [style.width.%]="model().usedPercent"></div>
        }
        @for (seg of model().segments; track seg.key) {
          @if (seg.percent > 0) {
            <div class="meter-fill" [ngClass]="'fill-' + seg.key" [style.width.%]="seg.percent"></div>
          }
        }
        @for (tick of model().thresholds; track tick.label) {
          <div class="meter-tick" [ngClass]="'tick-' + tick.label" [style.left.%]="tick.percent"></div>
        }
        @if (model().overflow) {
          <div class="meter-overflow-mark"></div>
        }
      </div>

      <div class="relative h-3 text-content-muted meter-labels" aria-hidden="true">
        @for (tick of model().thresholds; track tick.label) {
          <span class="absolute top-0 inline-flex items-center gap-0.5 -translate-x-1/2"
            [style.left.%]="tick.percent">
            @if (tick.label === 'warn') {
              <svg viewBox="0 0 8 8" class="h-1.5 w-1.5" fill="currentColor" aria-hidden="true">
                <path d="M4 0 8 8H0Z" />
              </svg>
            } @else {
              <svg viewBox="0 0 8 8" class="h-1.5 w-1.5" fill="currentColor" aria-hidden="true">
                <path d="M4 0 8 4 4 8 0 4Z" />
              </svg>
            }
            {{ tick.label }}
          </span>
        }
        @if (model().overflow) {
          <span class="absolute right-0 top-0">&raquo; over budget</span>
        }
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        @if (heap().usedBytes !== null) {
          <span class="inline-flex items-center gap-1.5">
            <span class="legend-swatch fill-used"></span>
            <span>in use</span>
            <span class="text-content-muted">{{ formatBytes(heap().usedBytes!) }}</span>
          </span>
        }
        @for (seg of model().segments; track seg.key) {
          <span class="inline-flex items-center gap-1.5">
            <span class="legend-swatch" [ngClass]="'fill-' + seg.key"></span>
            <span>{{ seg.label }}</span>
            <span class="text-content-muted">{{ formatBytes(seg.bytes) }}</span>
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    .meter-fill { box-sizing: border-box; height: 100%; flex: 0 0 auto; }
    .meter-fill + .meter-fill { border-left: 2px solid var(--content-bg); }
    .legend-swatch { width: 0.625rem; height: 0.625rem; border-radius: 0.125rem; flex: none; }
    .meter-labels { font-size: 10px; line-height: 1.2; }
    .meter-tick { position: absolute; top: 0; height: 100%; width: 2px; margin-left: -1px; }
    .tick-warn { background: #fab219; }
    .tick-high { background: #d03b3b; }
    .meter-overflow-mark {
      position: absolute; top: 0; right: 0; height: 100%; width: 4px;
      background: repeating-linear-gradient(
        135deg, #d03b3b 0, #d03b3b 2px, var(--content-bg) 2px, var(--content-bg) 4px);
    }

    .fill-used { background: #98a2b3; }
    .fill-user { background: #2a78d6; }
    .fill-organization { background: #1baf7a; }
    .fill-space { background: #eda100; }
    .fill-application { background: #008300; }
    .fill-route { background: #4a3aa7; }
    .fill-serviceInstance { background: #e34948; }

    :host-context(.dark) .fill-used { background: #5c6b82; }
    :host-context(.dark) .fill-user { background: #3987e5; }
    :host-context(.dark) .fill-organization { background: #199e70; }
    :host-context(.dark) .fill-space { background: #c98500; }
    :host-context(.dark) .fill-application { background: #008300; }
    :host-context(.dark) .fill-route { background: #9085e9; }
    :host-context(.dark) .fill-serviceInstance { background: #e66767; }
  `],
})
export class HeapHeadroomMeterComponent {
  readonly counts = input.required<Record<string, number | null | undefined>>();
  readonly heap = input.required<HeapInfo>();

  readonly formatBytes = formatBytes;

  readonly model = computed(() => {
    const heap = this.heap();
    return {
      ...computeSegments(this.counts(), heap),
      thresholds: thresholdPositions(heap),
    };
  });

  readonly ariaLabel = computed(() => {
    const totalBytes = this.model().segments.reduce((sum, seg) => sum + seg.bytes, 0);
    const budget = formatBytes(meterBudget(this.heap()));
    const overflow = this.model().overflow ? '; over budget' : '';
    return `Estimated footprint ${formatBytes(totalBytes)} of a ${budget} heap budget${overflow}`;
  });
}
