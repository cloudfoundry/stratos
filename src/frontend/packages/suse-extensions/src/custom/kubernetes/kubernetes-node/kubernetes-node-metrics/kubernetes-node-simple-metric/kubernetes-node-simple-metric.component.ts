import { Component, Input } from '@angular/core';
import { formatCPUTime } from '../../../kubernetes-metrics.helpers';

@Component({
  selector: 'app-kubernetes-node-simple-metric',
  templateUrl: './kubernetes-node-simple-metric.component.html',
  styleUrls: ['./kubernetes-node-simple-metric.component.scss']
})
export class KubernetesNodeSimpleMetricComponent {

  @Input()
  key: string;

  @Input()
  value: number;

  @Input()
  unit: string;

  public formatValue() {
    switch (this.unit) {
      case 'secs':
        return formatCPUTime(this.value);
      default:
        const unit = this.unit || '';
        return `${this.value} ${unit}`;
    }
  }
}
