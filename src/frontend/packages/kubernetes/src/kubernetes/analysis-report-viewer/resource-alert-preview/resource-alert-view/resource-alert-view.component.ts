import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

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

  // Either a list of alerts or an object that holds one in `alerts`.
  readonly alerts = input<any>();

  // The alerts grouped by resource. Alerts that go back to empty keep the last groups.
  readonly alertInfo = linkedSignal<any, ResourceAlertGroup[] | undefined>({
    source: this.alerts,
    computation: (data, previous) => data
      ? this.normalize(data.alerts ? data.alerts : data)
      : previous?.value,
  });

  readonly showHeader = input(true);

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
