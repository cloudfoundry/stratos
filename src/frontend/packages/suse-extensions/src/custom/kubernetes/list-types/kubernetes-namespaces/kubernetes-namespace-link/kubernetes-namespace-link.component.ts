import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNamespace } from '../../../store/kube.types';

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
  }

}
