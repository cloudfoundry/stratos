import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
import { PreviewableComponent } from '../../../shared/previewable-component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BasicKubeAPIResource } from '../store/kube.types';

export interface KubernetesResourceViewerConfig {
  title: string;
  resource$: Observable<BasicKubeAPIResource>;
  resourceKind?: string;
}

@Component({
  selector: 'app-kubernetes-resource-viewer',
  templateUrl: './kubernetes-resource-viewer.component.html',
  styleUrls: ['./kubernetes-resource-viewer.component.scss']
})
export class KubernetesResourceViewerComponent implements PreviewableComponent {

  constructor(
    private activatedRoute: ActivatedRoute,
    private endpointsService: EndpointsService,
    private kubeEndpointService: KubernetesEndpointService
  ) {
  }

  public title: string;
  public resource$: Observable<any>;

  public hasPodMetrics$: Observable<boolean>;
  public podRouterLink$: Observable<string[]>;

  setProps(props: KubernetesResourceViewerConfig) {
    this.title = props.title;
    this.resource$ = props.resource$.pipe(
      map((item: any) => {// KubeAPIResource

        const newItem = { ...item };
        newItem.age = moment(item.metadata.creationTimestamp).fromNow(true);

        newItem.labels = [];
        Object.keys(item.metadata.labels || []).forEach(labelName => {
          newItem.labels.push({
            name: labelName,
            value: item.metadata.labels[labelName]
          });
        });

        if (item.metadata && item.metadata.annotations) {
          newItem.annotations = [];
          Object.keys(item.metadata.annotations || []).forEach(labelName => {
            newItem.annotations.push({
              name: labelName,
              value: item.metadata.annotations[labelName]
            });
          });
        }

        newItem.kind = item.kind || props.resourceKind;
        newItem.apiVersion = item.apiVersion || this.getVersionFromSelfLink(item.metadata.selfLink);
        return newItem;
      }),
      publishReplay(1),
      refCount()
    );

    this.hasPodMetrics$ = this.resource$.pipe(
      switchMap(resource => {
        return resource.kind === 'pod' ?
          this.endpointsService.hasMetrics(this.getEndpointId(resource)) :
          of(false);
      }),
      first(),
    );

    this.podRouterLink$ = this.hasPodMetrics$.pipe(
      filter(hasPodMetrics => hasPodMetrics),
      switchMap(() => this.resource$),
      map(pod => {
        return [
          `/kubernetes`,
          this.getEndpointId(pod),
          `pods`,
          pod.metadata.namespace,
          pod.metadata.name
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
