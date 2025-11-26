import { ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

import { BytesToHumanSize, TableCellCustom } from '@stratosui/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-capacity',
  templateUrl: './kubernetes-node-capacity.component.html',
  styleUrls: ['./kubernetes-node-capacity.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [BytesToHumanSize]
})
export class KubernetesNodeCapacityComponent<T> extends TableCellCustom<T> {

  public getMemory(memoryCapacity: string) {
    if (memoryCapacity.endsWith('Ki')) {
      const value = parseInt(memoryCapacity, 10);
      return (value * 1024);

    }
    return memoryCapacity;
  }
}
