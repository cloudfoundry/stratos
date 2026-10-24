import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core';

import { MetadataItemComponent, ScrollFadeComponent } from '@stratosui/core';

import { coolDownUntil, limitsNow } from '../../core/autoscaler-helpers/autoscaler-now';
import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import { AppAutoscalerEvent, AppAutoscalerMetricDataLocal, AppAutoscalerPolicyLocal, AppScalingRule } from '../../store/app-autoscaler.types';

interface MetricNow {
  name: string;
  value: number | null;
  unit: string;
  color?: string;
  scaleOut: string;
  scaleIn: string;
}

/**
 * What the autoscaler is working with now: the limits in effect (default or
 * schedule) and when they change, the last scaling event and its cool-down,
 * and each metric's latest value against its thresholds, which the gauges do
 * not show as numbers.
 */
@Component({
  selector: 'app-card-autoscaler-now',
  templateUrl: './card-autoscaler-now.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DatePipe, DecimalPipe, MetadataItemComponent, ScrollFadeComponent],
})
export class CardAutoscalerNowComponent {
  readonly policy = input.required<AppAutoscalerPolicyLocal>();
  readonly metrics = input<Record<string, Signal<{ entity: AppAutoscalerMetricDataLocal }[]>>>({});
  readonly history = input<AppAutoscalerEvent[] | undefined>([]);

  readonly limits = computed(() => limitsNow(this.policy()));

  readonly lastEvent = computed(() => this.history()?.[0]);

  readonly coolDown = computed(() => {
    const until = coolDownUntil(this.lastEvent(), this.policy().scaling_rules_form);
    return until && until > Date.now() ? until : null;
  });

  readonly metricRows = computed<MetricNow[]>(() => {
    const map = this.policy().scaling_rules_map ?? {};
    const metrics = this.metrics();
    return Object.keys(map).map(name => {
      const latest = metrics[name]?.()?.[0]?.entity.latest;
      const unit = AutoscalerConstants.getMetricUnit(name, map[name].upper?.[0]?.unit || map[name].lower?.[0]?.unit);
      const rule = (r: AppScalingRule) => `${r.operator} ${r.threshold}${unit}`;
      const value = latest?.target?.[0]?.value;
      const color = latest?.colorTarget?.[0]?.value;
      return {
        name,
        value: value === undefined ? null : Number(value),
        unit,
        color: typeof color === 'string' ? color : undefined,
        scaleOut: (map[name].upper ?? []).map(rule).join(', '),
        scaleIn: (map[name].lower ?? []).map(rule).join(', '),
      };
    });
  });

  readonly timezone = computed(() => this.policy().schedules?.timezone);
}
