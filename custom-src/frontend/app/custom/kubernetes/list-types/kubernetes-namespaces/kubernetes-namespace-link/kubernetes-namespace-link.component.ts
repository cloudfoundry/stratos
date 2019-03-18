import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesNamespace } from '../../../store/kube.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';

@Component({
  selector: 'app-kubernetes-namespace-link',
  templateUrl: './kubernetes-namespace-link.component.html',
  styleUrls: ['./kubernetes-namespace-link.component.scss']
})
export class KubernetesNamespaceLinkComponent extends TableCellCustom<KubernetesNamespace> implements OnInit {
  routerLink: string;
  dashboardLink: string;
  constructor(public kubeEndpointService: KubernetesEndpointService) {
    super();
   }

  ngOnInit() {
    this.routerLink = `${this.row.metadata.name}`;
    const guid = this.kubeEndpointService.baseKube.guid;
    this.dashboardLink = `/kubernetes/${guid}/dashboard/overview?namespace=${this.row.metadata.name}`;
  }

}
