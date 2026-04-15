import { ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

import { BytesToHumanSize } from '@stratosui/core';
import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-capacity',
  templateUrl: './kubernetes-node-capacity.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [BytesToHumanSize]
})
export class KubernetesNodeCapacityComponent<T> extends TableCellCustom<T> {

  constructor() {
    super();
  }

  public getMemory(memoryCapacity: string) {
    if (memoryCapacity.endsWith('Ki')) {
      const value = parseInt(memoryCapacity, 10);
      return (value * 1024);

    }
    return memoryCapacity;
  }
}
