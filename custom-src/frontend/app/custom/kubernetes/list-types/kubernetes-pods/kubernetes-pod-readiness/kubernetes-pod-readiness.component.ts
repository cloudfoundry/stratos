import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { ContainerStatus, KubernetesPod } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-pod-readiness',
  templateUrl: './kubernetes-pod-readiness.component.html',
  styleUrls: ['./kubernetes-pod-readiness.component.scss']
})
export class KubernetesPodReadinessComponent extends TableCellCustom<KubernetesPod> implements OnInit {

  public total = 0;
  public ready = 0;

  ngOnInit() {
    if (this.row.status.phase === 'Failed') {
      return `0 / ${this.row.spec.containers.length}`;
    }

    const containers = this.row.status.containerStatuses || [];
    this.total = containers.length;
    this.ready = containers.reduce((r: number, cstatus: ContainerStatus) => cstatus.ready ? r + 1 : r, 0);
  }

}
