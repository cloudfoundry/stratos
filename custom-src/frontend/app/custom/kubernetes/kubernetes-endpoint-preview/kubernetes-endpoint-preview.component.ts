import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import {
  ISimpleUsageChartData,
} from '../../../../../core/src/shared/components/simple-usage-chart/simple-usage-chart.types';
import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';

@Component({
  selector: 'app-kubernetes-endpoint-preview-component',
  templateUrl: './kubernetes-endpoint-preview.component.html',
  styleUrls: ['./kubernetes-endpoint-preview.component.scss']
})
export class KubernetesEndpointPreviewComponent implements PreviewableComponent {

  title: string = null;
  detailsLoading$: Observable<boolean>;
  kubeVersion$: Observable<string>;
  podCount$: Observable<number>;
  nodeCount$: Observable<number>;
  appCount$: Observable<number>;
  podCapacity$: Observable<ISimpleUsageChartData>;
  diskPressure$: Observable<ISimpleUsageChartData>;
  memoryPressure$: Observable<ISimpleUsageChartData>;
  outOfDisk$: Observable<ISimpleUsageChartData>;
  nodesReady$: Observable<ISimpleUsageChartData>;
  podsLink: string;
  nodesLink: string;
  appsLink: string;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
  ) { }

  setProps(props: { [key: string]: any }) {
    const kubeGuid = props.cfGuid;

    this.title = props.title;

    this.kubeEndpointService.initialize(kubeGuid);
    const nodes$ = this.kubeEndpointService.nodes$;

    this.kubeVersion$ = this.kubeEndpointService.getNodeKubeVersions();
    this.podCount$ = this.kubeEndpointService.getCountObservable(this.kubeEndpointService.pods$);
    this.nodeCount$ = this.kubeEndpointService.getCountObservable(nodes$);
    this.appCount$ = this.kubeEndpointService.getCountObservable(this.kubeEndpointService.apps$);
    this.podCapacity$ = this.kubeEndpointService.getPodCapacity();
    this.diskPressure$ = this.kubeEndpointService.getNodeStatusCount(this.kubeEndpointService.nodes$, 'DiskPressure');
    this.memoryPressure$ = this.kubeEndpointService.getNodeStatusCount(this.kubeEndpointService.nodes$, 'MemoryPressure');
    this.outOfDisk$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'OutOfDisk');
    this.nodesReady$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'Ready');

    this.podsLink = `/kubernetes/${kubeGuid}/pods`;
    this.nodesLink = `/kubernetes/${kubeGuid}/nodes`;
    this.appsLink = `/kubernetes/${kubeGuid}/apps`;

    this.detailsLoading$ = combineLatest([
      this.podCount$,
      this.nodeCount$,
      this.appCount$,
      this.podCapacity$,
      this.diskPressure$,
      this.memoryPressure$,
      this.outOfDisk$,
      this.nodesReady$,
      // this.networkUnavailable$,
    ]).pipe(
      map(() => false),
      startWith(true),
    );
  }
}
