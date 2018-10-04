import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesPod } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-pods-link',
  templateUrl: './kubernetes-node-pods-link.component.html',
  styleUrls: ['./kubernetes-node-pods-link.component.scss']
})
export class KubernetesNodePodsLinkComponent extends TableCellCustom<KubernetesPod> implements OnInit {
  routerLink: string;
  constructor() {
    super();
   }

  ngOnInit() {
    this.routerLink = `${this.row.metadata.name}`;
  }

}
