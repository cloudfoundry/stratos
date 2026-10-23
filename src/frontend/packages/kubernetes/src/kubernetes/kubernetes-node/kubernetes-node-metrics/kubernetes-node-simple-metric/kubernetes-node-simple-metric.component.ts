import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { formatCPUTime } from '../../../kubernetes-metrics.helpers';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-simple-metric',
  templateUrl: './kubernetes-node-simple-metric.component.html',
  standalone: true
})
export class KubernetesNodeSimpleMetricComponent {

  // Every caller binds key and value.
  readonly key = input.required<string>();

  // Callers bind interpolated (already formatted) values, so this is a string.
  readonly value = input.required<string>();

  // Optional - callers may omit the unit; formatValue() falls back to ''
  readonly unit = input<string>();

  public formatValue() {
    const unitValue = this.unit();
    switch (unitValue) {
      case 'secs':
        return formatCPUTime(this.value());
      default: {
        const unit = unitValue || '';
        return `${this.value()} ${unit}`;
      }
    }
  }
}
