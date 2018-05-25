import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';

@Component({
  selector: 'app-kubernetes-node-capacity',
  templateUrl: './kubernetes-node-capacity.component.html',
  styleUrls: ['./kubernetes-node-capacity.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class KubernetesNodeCapacityComponent<T> extends TableCellCustom<T> implements OnInit {

  constructor() {
    super();
  }

  private value: string;
  private label: string;

  ngOnInit() {
    this.value = this.config ? this.config.value : row => 0;
    this.label = this.config ? this.config.label : row => '-';
  }

}