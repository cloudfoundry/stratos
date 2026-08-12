import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';

/** The inline busy-indicator variant pool. */
export type BusyVariant = 'arc' | 'dual-ring' | 'dash' | 'dots' | 'logo';

const VARIANT_POOL: readonly BusyVariant[] = ['arc', 'dual-ring', 'dash', 'dots'];

/**
 * Deterministic variant pick: the same context string always yields the
 * same variant, so a given page keeps one look across visits while
 * different pages vary. `logo` is opt-in only (never auto-picked) —
 * a spinning brand mark everywhere would be noise.
 */
export function pickBusyVariant(context: string): BusyVariant {
  let h = 0;
  for (let i = 0; i < context.length; i++) {
    h = (h * 31 + context.charCodeAt(i)) | 0;
  }
  return VARIANT_POOL[Math.abs(h) % VARIANT_POOL.length];
}

/**
 * AppBusyComponent — the one inline waiting-for-data indicator.
 *
 * Replaces the hand-rolled border-circle divs, inline SVG arcs and
 * spinning material icons that used to be pasted per call site. Sized in
 * `em` so it inherits the surrounding text scale, and colored via
 * `currentColor` so `class="text-primary"` (or any text color, in either
 * theme) restyles it — no light/dark rules needed here.
 *
 * Variants (requirement: the same spinner need not look the same
 * everywhere):
 * - `arc`       — border circle, faint track, bright head (the classic).
 * - `dual-ring` — two opposing arcs.
 * - `dash`      — dashed border circle.
 * - `dots`      — three sequentially blinking dots (also the animated
 *                 pending-count marker, ex-'…').
 * - `logo`      — the theme's brand mark rotating; opt-in only.
 *
 * Pass `variant` to pin a look, or `context` (any stable string — a
 * label, a route) to let pickBusyVariant choose deterministically.
 * Neither → `arc`.
 */
@Component({
  selector: 'app-busy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center justify-center align-middle"
          [style.width]="size" [style.height]="size"
          role="status" aria-label="Loading" data-test="busy">
      @switch (resolved()) {
        @case ('dual-ring') {
          <span class="block h-full w-full rounded-full animate-spin border-2 border-solid"
                style="border-color: currentColor transparent currentColor transparent;"></span>
        }
        @case ('dash') {
          <span class="block h-full w-full rounded-full animate-spin border-2 border-dashed border-current"></span>
        }
        @case ('dots') {
          <span class="flex items-center gap-[0.18em]">
            <span class="busy-blink-dot block h-[0.28em] w-[0.28em] rounded-full bg-current"></span>
            <span class="busy-blink-dot block h-[0.28em] w-[0.28em] rounded-full bg-current" style="animation-delay: 0.2s"></span>
            <span class="busy-blink-dot block h-[0.28em] w-[0.28em] rounded-full bg-current" style="animation-delay: 0.4s"></span>
          </span>
        }
        @case ('logo') {
          <img class="block h-full w-full animate-spin" style="animation-duration: 1.6s"
               [src]="themeLogo()" alt="" aria-hidden="true" />
        }
        @default {
          <span class="block h-full w-full rounded-full animate-spin border-2 border-solid"
                style="border-color: color-mix(in srgb, currentColor 25%, transparent); border-right-color: currentColor;"></span>
        }
      }
    </span>
  `,
})
export class AppBusyComponent {
  /** Pin a specific variant; overrides `context`. */
  @Input() variant?: BusyVariant;

  /** Stable string used to pick a variant deterministically. */
  @Input() context?: string;

  /** CSS size of the indicator square. Defaults to text height. */
  @Input() size = '1em';

  private branding = inject(StratosBrandingService, { optional: true });

  protected readonly themeLogo = computed(
    () => this.branding?.theme()?.branding?.logo || '/core/assets/logo.png',
  );

  protected resolved(): BusyVariant {
    if (this.variant) return this.variant;
    if (this.context) return pickBusyVariant(this.context);
    return 'arc';
  }
}
