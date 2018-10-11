import { Component, OnInit } from '@angular/core';
import { KubernetesPod } from '../../../store/kube.types';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../../../features/cloud-foundry/cf.helpers';
import { EndpointsService } from '../../../../../core/endpoints.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pod-name-link',
  templateUrl: './pod-name-link.component.html',
  styleUrls: ['./pod-name-link.component.scss']
})
export class PodNameLinkComponent extends TableCellCustom<KubernetesPod> implements OnInit {
  routerLink: string[];
  hasMetrics$: Observable<boolean>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private endpointsService: EndpointsService,
    private kubeEndpointService: KubernetesEndpointService
  ) {
    super();
  }

  ngOnInit() {
    this.hasMetrics$ = this.endpointsService.hasMetrics(this.kubeEndpointService.kubeGuid).pipe(
      first()
    );
    const namespace = getIdFromRoute(this.activatedRoute, 'namespaceName');
    if (!namespace) {
      this.routerLink = [this.row.metadata.namespace, this.row.metadata.name];
    } else {
      this.routerLink = [this.row.metadata.name];
    }
  }
}
