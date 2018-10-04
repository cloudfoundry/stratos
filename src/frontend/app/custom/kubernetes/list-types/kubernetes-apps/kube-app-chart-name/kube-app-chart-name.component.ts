import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesApp } from '../../../store/kube.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-kube-app-chart-name',
  templateUrl: './kube-app-chart-name.component.html',
  styleUrls: ['./kube-app-chart-name.component.scss']
})
export class KubeAppChartNameComponent extends TableCellCustom<KubernetesApp> implements OnInit {
  chartName$: Observable<string>;

  constructor(
    private kubeServiceEndpoint: KubernetesEndpointService
  ) {
    super();
  }

  ngOnInit() {

    this.chartName$ = combineLatest(this.kubeServiceEndpoint.deployments$, this.kubeServiceEndpoint.statefulSets$).pipe(
      map(([deployments, statefulsets]) => {

        const releaseDeployment = deployments.filter(d => d.metadata.labels['app.kubernetes.io/name'] === this.row.name);
        const releaseStatefulSets = statefulsets.filter(d => d.metadata.labels['app.kubernetes.io/name'] === this.row.name);

        if (releaseDeployment.length !== 0) {
          return releaseDeployment[0].metadata.labels['helm.sh/chart'];
        }
        if (releaseStatefulSets.length !== 0) {
          return releaseStatefulSets[0].metadata.labels['helm.sh/chart'];
        }
      })
    );
  }

}
