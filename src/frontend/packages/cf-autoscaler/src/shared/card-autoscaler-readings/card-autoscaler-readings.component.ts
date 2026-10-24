import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core';

import { ScrollFadeComponent } from '@stratosui/core';

import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import { AppAutoscalerMetricDataLocal, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

/**
 * Each policy metric's latest value as a number, which the gauges do not show.
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

  readonly readings = computed(() => {
    const map = this.policy().scaling_rules_map ?? {};
    const metrics = this.metrics();
    return Object.keys(map).map(name => {
      const value = metrics[name]?.()?.[0]?.entity.latest?.target?.[0]?.value;
      return {
        name,
        value: value === undefined ? null : Number(value),
        // The unit map pads percent (' % ') for the rule text; a value reads 10%
        unit: AutoscalerConstants.getMetricUnit(name, map[name].upper?.[0]?.unit || map[name].lower?.[0]?.unit).trim(),
      };
    });
  });
}
