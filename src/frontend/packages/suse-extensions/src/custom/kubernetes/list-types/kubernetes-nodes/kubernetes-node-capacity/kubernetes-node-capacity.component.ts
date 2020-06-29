import { Component, ViewEncapsulation } from '@angular/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';


@Component({
  selector: 'app-kubernetes-node-capacity',
  templateUrl: './kubernetes-node-capacity.component.html',
  styleUrls: ['./kubernetes-node-capacity.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
