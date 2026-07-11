import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { formatCPUTime } from '../../../kubernetes-metrics.helpers';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-simple-metric',
  templateUrl: './kubernetes-node-simple-metric.component.html',
  standalone: true
})
export class KubernetesNodeSimpleMetricComponent {

  // strict: required @Input, set by Angular before the template reads it
  @Input()
  key!: string;

  // strict: required @Input, set by Angular before the template reads it.
  // Callers bind interpolated (already formatted) values, so this is a string.
  @Input()
  value!: string;

  // Optional - callers may omit the unit; formatValue() falls back to ''
  @Input()
  unit?: string;

  public formatValue() {
    switch (this.unit) {
      case 'secs':
        return formatCPUTime(this.value);
      default: {
        const unit = this.unit || '';
        return `${this.value} ${unit}`;
      }
    }
  }
}
