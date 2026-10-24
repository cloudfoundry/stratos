import { DecimalPipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, Signal, computed, inject, input } from '@angular/core';

import { ScrollFadeComponent } from '@stratosui/core';

import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import { AppAutoscalerMetricDataLocal, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

/**
 * Each policy metric's latest value as a number, which the gauges do not
 * show, with the gauge's status colour as a dot.
 */
@Component({
  selector: 'app-card-autoscaler-readings',
  templateUrl: './card-autoscaler-readings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DecimalPipe, ScrollFadeComponent],
})
export class CardAutoscalerReadingsComponent {
  readonly policy = input.required<AppAutoscalerPolicyLocal>();
  readonly metrics = input<Record<string, Signal<{ entity: AppAutoscalerMetricDataLocal }[]>>>({});

  private readonly locale = inject(LOCALE_ID);

  readonly readings = computed(() => {
    const map = this.policy().scaling_rules_map ?? {};
    const metrics = this.metrics();
    return Object.keys(map).map(name => {
      const latest = metrics[name]?.()?.[0]?.entity.latest;
      const value = latest?.target?.[0]?.value;
      const color = latest?.colorTarget?.[0]?.value;
      return {
        name,
        value: value === undefined ? null : Number(value),
        time: latest?.target?.[0]?.time,
        color: typeof color === 'string' ? color : null,
        unit: AutoscalerConstants.getMetricUnit(name, map[name].upper?.[0]?.unit || map[name].lower?.[0]?.unit),
      };
    });
  });

  // When the oldest and newest readings were taken, compact ISO in local
  // time: 2026-10-24 02:03:11–02:03:41, the date once when both share it
  readonly taken = computed(() => {
    const times = this.readings().map(r => r.time).filter((t): t is number => t !== undefined);
    if (!times.length) {
      return null;
    }
    const [oldest, newest] = [Math.min(...times), Math.max(...times)].map(t => formatDate(t * 1000, 'yyyy-MM-dd HH:mm:ss', this.locale));
    if (oldest === newest) {
      return oldest;
    }
    return `${oldest}–${newest.slice(0, 10) === oldest.slice(0, 10) ? newest.slice(11) : newest}`;
  });
}
