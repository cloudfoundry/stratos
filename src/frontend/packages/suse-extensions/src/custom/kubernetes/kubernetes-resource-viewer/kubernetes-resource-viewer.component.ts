import { Component } from '@angular/core';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BasicKubeAPIResource, KubeAPIResource, KubeStatus } from '../store/kube.types';

export interface KubernetesResourceViewerConfig {
  title: string;
  analysis?: any;
  resource$: Observable<BasicKubeAPIResource>;
  resourceKind: string;
}

interface KubernetesResourceViewerResource {
  raw: any;
  jsonView: KubeAPIResource;
  age: string;
  creationTimestamp: string;
  labels: { name: string, value: string, }[];
  annotations: { name: string, value: string, }[];
  kind: string;
  apiVersion: string;
}

@Component({
  selector: 'app-kubernetes-resource-viewer',
  templateUrl: './kubernetes-resource-viewer.component.html',
  styleUrls: ['./kubernetes-resource-viewer.component.scss']
})
export class KubernetesResourceViewerComponent implements PreviewableComponent {

  constructor(
    private endpointsService: EndpointsService,
    private kubeEndpointService: KubernetesEndpointService
  ) {
  }

  public title: string;
  public resource$: Observable<KubernetesResourceViewerResource>;

  public hasPodMetrics$: Observable<boolean>;
  public podRouterLink$: Observable<string[]>;

  private analysis;
  public alerts;

  setProps(props: KubernetesResourceViewerConfig) {
    this.title = props.title;
    this.analysis = props.analysis;
    this.resource$ = props.resource$.pipe(
      filter(item => !!item),
      map((item: (KubeAPIResource | KubeStatus)) => {
        const resource: KubernetesResourceViewerResource = {} as KubernetesResourceViewerResource;
        const newItem = {} as any;

        resource.raw = item;
        Object.keys(item || []).forEach(k => {
          if (k !== 'endpointId' && k !== 'releaseTitle' && k !== 'expandedStatus' && k !== '_metadata') {
            newItem[k] = item[k];
          }
        });

        resource.jsonView = newItem;

        /* tslint:disable-next-line:no-string-literal  */
        const fallback = item['_metadata'] || {};

        const ts = item.metadata ? item.metadata.creationTimestamp : fallback.creationTimestamp;
        resource.age = moment(ts).fromNow(true);
        resource.creationTimestamp = ts;

        if (item.metadata && item.metadata.labels) {
          resource.labels = [];
          Object.keys(item.metadata.labels || []).forEach(labelName => {
            resource.labels.push({
              name: labelName,
              value: item.metadata.labels[labelName]
            });
          });
        }

        if (item.metadata && item.metadata.annotations) {
          resource.annotations = [];
          Object.keys(item.metadata.annotations || []).forEach(labelName => {
            resource.annotations.push({
              name: labelName,
              value: item.metadata.annotations[labelName]
            });
          });
        }

        /* tslint:disable-next-line:no-string-literal  */
        resource.kind = item['kind'] || fallback.kind || props.resourceKind;
        /* tslint:disable-next-line:no-string-literal  */
        resource.apiVersion = item['apiVersion'] || fallback.apiVersion || this.getVersionFromSelfLink(item.metadata['selfLink']);

        // Apply analysis if there is one - if this is a k8s resource (i.e. not a container)
        if (item.metadata) {
          this.applyAnalysis(resource);
        }
        return resource;
      }),
      publishReplay(1),
      refCount()
    );

    this.hasPodMetrics$ = props.resourceKind === 'pod' ?
      this.resource$.pipe(
        switchMap(resource => this.endpointsService.hasMetrics(this.getEndpointId(resource.raw))),
        first(),
      ) :
      of(false);

    this.podRouterLink$ = this.hasPodMetrics$.pipe(
      filter(hasPodMetrics => hasPodMetrics),
      switchMap(() => this.resource$),
      map(pod => {
        return [
          `/kubernetes`,
          this.getEndpointId(pod.raw),
          `pods`,
          pod.raw.metadata.namespace,
          pod.raw.metadata.name
        ];
      })
    );
  }

  private getVersionFromSelfLink(url: string): string {
    if (!url) {
      return;
    }
    const parts = url.split('/');
    return `${parts[1]}/${parts[2]}`;
  }

  private getEndpointId(res): string {
    return this.kubeEndpointService.kubeGuid || res.endpointId || res.metadata.kubeId;
  }

  private applyAnalysis(resource) {
    let id = (resource.kind || 'pod').toLowerCase();
    id = `${id}/${resource.raw.metadata.namespace}/${resource.raw.metadata.name}`;
    if (this.analysis && this.analysis.alerts[id]) {
      this.alerts = this.analysis.alerts[id];
    } else {
      this.alerts = null;
    }
  }

}
