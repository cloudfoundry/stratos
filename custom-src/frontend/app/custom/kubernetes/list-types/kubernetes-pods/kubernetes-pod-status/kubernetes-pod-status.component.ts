import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesPod, KubernetesStatus } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-pod-status',
  templateUrl: './kubernetes-pod-status.component.html',
  styleUrls: ['./kubernetes-pod-status.component.scss']
})
export class KubernetesPodStatusComponent extends TableCellCustom<KubernetesPod> implements OnInit {

  public style = 'border-success';

  ngOnInit() {
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
