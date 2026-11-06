import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';

/** Area-loader variant pool. */
export type AreaLoaderVariant = 'arc' | 'dots' | 'sweep' | 'shimmer';

const VARIANT_POOL: readonly AreaLoaderVariant[] = ['arc', 'dots', 'sweep', 'shimmer'];

/** Same deterministic pick as app-busy, over the area pool. */
export function pickAreaVariant(context: string): AreaLoaderVariant {
  let h = 0;
  for (let i = 0; i < context.length; i++) {
    h = (h * 31 + context.charCodeAt(i)) | 0;
  }
  return VARIANT_POOL[Math.abs(h) % VARIANT_POOL.length];
}

/**
 * AppAreaLoaderComponent — the block-level "Loading <thing>…" indicator
 * for list bodies and card interiors. Centers itself in whatever box the
 * host gives it (requirement: keep the indicator's existing footprint —
 * this renders inside the same container the old spinner blocks did).
 *
 * Variants:
 * - `arc`     — the classic spinner beside the message.
 * - `dots`    — three blinking dots beside the message.
 * - `sweep`   — conic-gradient ring (radar-style sweep).
 * - `shimmer` — the message itself carries a gradient sweep, no spinner.
 *
 * `context` (default: the message) picks deterministically; `variant`
 * pins. Colors ride currentColor / theme tokens — dark mode free.
 */
@Component({
  selector: 'app-area-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppBusyComponent],
  template: `
    <div class="flex items-center justify-center p-8 h-full" data-test="area-loader" role="status">
      <div class="flex items-center space-x-4 text-content-muted">
        @switch (resolved()) {
          @case ('dots') {
            <app-busy variant="dots" size="1.75rem" class="text-primary"></app-busy>
            <span class="text-lg">{{ message }}</span>
          }
          @case ('sweep') {
            <span class="block h-7 w-7 rounded-full animate-spin"
                  style="background: conic-gradient(from 0deg, transparent 0deg 250deg, var(--color-primary) 360deg);
                         -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);
                         mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);"></span>
            <span class="text-lg">{{ message }}</span>
          }
          @case ('shimmer') {
            <span class="text-lg busy-shimmer bg-clip-text text-transparent bg-[length:200%_100%]"
                  style="background-image: linear-gradient(90deg,
                           color-mix(in srgb, var(--color-primary) 35%, transparent),
                           var(--color-primary),
                           color-mix(in srgb, var(--color-primary) 35%, transparent));">{{ message }}</span>
          }
          @default {
            <app-busy variant="arc" size="1.75rem" class="text-primary"></app-busy>
            <span class="text-lg">{{ message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class AppAreaLoaderComponent {
  /** The "Loading <thing>…" text. Also the default variant context. */
  @Input() message = 'Loading…';

  /** Pin a specific variant; overrides `context`. */
  @Input() variant?: AreaLoaderVariant;

  /** Stable string for the deterministic pick; defaults to the message. */
  @Input() context?: string;

  protected resolved(): AreaLoaderVariant {
    if (this.variant) return this.variant;
    return pickAreaVariant(this.context ?? this.message);
  }
}
