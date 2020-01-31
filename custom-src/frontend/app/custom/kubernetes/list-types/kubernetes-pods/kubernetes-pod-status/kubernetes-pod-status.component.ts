import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesPod, KubernetesStatus } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-pod-status',
  templateUrl: './kubernetes-pod-status.component.html',
  styleUrls: ['./kubernetes-pod-status.component.scss']
})
export class KubernetesPodStatusComponent extends TableCellCustom<KubernetesPod> {

  public style = 'border-success';

  private pRow: KubernetesPod;
  @Input('row')
  get row(): KubernetesPod { return this.pRow; }
  set row(row: KubernetesPod) {
    this.pRow = row;
    if (row) {
      this.updateStatus();
    }
  }

  updateStatus() {
    let status: string;
    switch (this.row.status.phase) {
      case 'Running':
        status = 'success';
        break;
      case KubernetesStatus.PENDING:
        status = 'warning';
        break;
      default:
        status = 'tentative';
        break;
    }

    this.style = `border-${status} text-${status}`;
  }
}
