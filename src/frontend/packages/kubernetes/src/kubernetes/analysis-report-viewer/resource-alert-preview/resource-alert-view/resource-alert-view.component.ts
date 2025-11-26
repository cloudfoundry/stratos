import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import type { ResourceAlert } from '../../../services/analysis-report.types';

interface AlertGroup {
  name: string;
  alerts: Array<ResourceAlert & { path: string }>;
}

interface AlertDataInput {
  alerts?: ResourceAlert[];
}

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-alert-view',
  templateUrl: './resource-alert-view.component.html',
  styleUrls: ['./resource-alert-view.component.scss'],
  standalone: true
})
export class ResourceAlertViewComponent {

  alertInfo!: AlertGroup[];

  @Input()
  set alerts(data: ResourceAlert[] | AlertDataInput) {
    if (data) {
      const alerts = Array.isArray(data) ? data : (data as AlertDataInput).alerts || [];
      this.alertInfo = this.normalize(alerts);
    }
  }

  @Input() showHeader = true;

  normalize(data: ResourceAlert[]): AlertGroup[] {
    // Normalize the alerts into groups
    const normalized: Record<string, Array<ResourceAlert & { path: string }>> = {};
    data.forEach(item => {
      const path = item.namespace ? `${item.namespace}/${item.name}` : item.name;
      if (!normalized[path]) {
        normalized[path] = [];
      }
      normalized[path].push({
        ...item,
        path
      });
    });

    const arr: AlertGroup[] = [];
    Object.keys(normalized).forEach(group => {
      arr.push({
        name: group,
        alerts: normalized[group]
      });
    });
    return arr;
  }

}
