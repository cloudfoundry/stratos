import { Component } from '@angular/core';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BasicKubeAPIResource, KubeAPIResource } from '../store/kube.types';

export interface KubernetesResourceViewerConfig {
  title: string;
  resource$: Observable<BasicKubeAPIResource>;
  resourceKind: string;
}

interface KubernetesResourceViewerResource {
  raw: any;
  jsonView: KubeAPIResource;
  age: string;
  creationTimestamp: string;
  labels: { name: string, value: string }[];
  annotations: { name: string, value: string }[];
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

  setProps(props: KubernetesResourceViewerConfig) {
    this.title = props.title;
    this.resource$ = props.resource$.pipe(
      map((item: any) => {// KubeAPIResource
        const resource: KubernetesResourceViewerResource = {} as KubernetesResourceViewerResource;
        const newItem = {} as any;

        resource.raw = item;

        Object.keys(item || []).forEach(k => {
          if (k !== 'endpointId' && k !== 'releaseTitle' && k !== 'expandedStatus') {
            newItem[k] = item[k];
          }
        });

        resource.jsonView = newItem;
        resource.age = moment(item.metadata.creationTimestamp).fromNow(true);
        resource.creationTimestamp = item.metadata.creationTimestamp;

        resource.labels = [];
        Object.keys(item.metadata.labels || []).forEach(labelName => {
          resource.labels.push({
            name: labelName,
            value: item.metadata.labels[labelName]
          });
        });

        if (item.metadata && item.metadata.annotations) {
          resource.annotations = [];
          Object.keys(item.metadata.annotations || []).forEach(labelName => {
            resource.annotations.push({
              name: labelName,
              value: item.metadata.annotations[labelName]
            });
          });
        }

        resource.kind = item.kind || props.resourceKind;
        resource.apiVersion = item.apiVersion || this.getVersionFromSelfLink(item.metadata.selfLink);
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

}
