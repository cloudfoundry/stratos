import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesApp } from '../../../store/kube.types';
import { combineLatest, Observable } from 'rxjs';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-kube-app-version',
  templateUrl: './kube-app-version.component.html',
  styleUrls: ['./kube-app-version.component.scss']
})
export class KubeAppVersionComponent extends TableCellCustom<KubernetesApp> implements OnInit {
  chartVersion$: Observable<string>;

  constructor(
    private kubeServiceEndpoint: KubernetesEndpointService
  ) {
    super();
   }

  ngOnInit() {

    this.chartVersion$ = combineLatest(this.kubeServiceEndpoint.deployments$, this.kubeServiceEndpoint.statefulSets$).pipe(
      map(([deployments, statefulsets]) => {

        const releaseDeployment = deployments.filter(d => d.metadata.labels['app.kubernetes.io/name'] === this.row.name);
        const releaseStatefulSets = statefulsets.filter(d => d.metadata.labels['app.kubernetes.io/name'] === this.row.name);

        if (releaseDeployment.length !== 0) {
          return releaseDeployment[0].metadata.labels['app.kubernetes.io/version'];
        }
        if (releaseStatefulSets.length !== 0) {
          return releaseStatefulSets[0].metadata.labels['app.kubernetes.io/version'];
        }
      })
    );
  }

}
