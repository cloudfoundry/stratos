import { ChangeDetectionStrategy, Component, Input} from '@angular/core';

interface ResourceAlert {
  namespace?: string;
  name?: string;
  level?: number;
  message?: string;
  path?: string;
}

interface ResourceAlertGroup {
  name: string;
  alerts: ResourceAlert[];
}

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-alert-view',
  templateUrl: './resource-alert-view.component.html',
  standalone: true
})
export class ResourceAlertViewComponent {

  alertInfo?: ResourceAlertGroup[];

  @Input()
  set alerts(data: any) {
    if (data) {
      const alerts = data.alerts ? data.alerts : data;
      this.alertInfo = this.normalize(alerts);
    }
  }

  @Input() showHeader = true;

  normalize(data: ResourceAlert[]): ResourceAlertGroup[] {
    // Normalize the alerts into groups
    const normalized: Record<string, ResourceAlert[]> = {};
    data.forEach(item => {
      const path = item.namespace ? `${item.namespace}/${item.name}` : item.name ?? '';
      if (!normalized[path]) {
        normalized[path] = [];
      }
      normalized[path].push({
        ...item,
        path
      });
    });

    const arr: ResourceAlertGroup[] = [];
    Object.keys(normalized).forEach(group => {
      arr.push({
        name: group,
        alerts: normalized[group]
      });
    });
    return arr;
  }

}
