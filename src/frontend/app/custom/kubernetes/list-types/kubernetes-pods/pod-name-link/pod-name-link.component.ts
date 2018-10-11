import { Component, OnInit } from '@angular/core';
import { KubernetesPod } from '../../../store/kube.types';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../../../features/cloud-foundry/cf.helpers';

@Component({
  selector: 'app-pod-name-link',
  templateUrl: './pod-name-link.component.html',
  styleUrls: ['./pod-name-link.component.scss']
})
export class PodNameLinkComponent extends TableCellCustom<KubernetesPod> implements OnInit {
  routerLink: string[];

  constructor(private activatedRoute: ActivatedRoute) {
    super();
  }

  ngOnInit() {
    // If namespace exists in the route, then don't add it the the URL
    const namespace = getIdFromRoute(this.activatedRoute, 'namespaceName');
    if (!namespace) {
      this.routerLink = [this.row.metadata.namespace, this.row.metadata.name];
    } else {
      this.routerLink = [this.row.metadata.name];
    }
  }
}
