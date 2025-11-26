import { AsyncPipe } from '@angular/common';
import {Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TableCellCustom } from '@stratosui/core';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import type { KubernetesNamespace } from '../../../store/kube.types';

@Component({
  selector: 'app-kube-namespace-pod-count',
  templateUrl: './kube-namespace-pod-count.component.html',
  styleUrls: ['./kube-namespace-pod-count.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe]
})
export class KubeNamespacePodCountComponent extends TableCellCustom<KubernetesNamespace> implements OnInit {
  podCount$: Observable<number>;
  private kubeEndpointService = inject(KubernetesEndpointService);

  ngOnInit() {

    this.podCount$ = this.kubeEndpointService.pods$.pipe(
      map(pods => pods.filter(p => p.metadata.namespace === this.row.metadata.name)),
      map(p => p.length)
    );
  }

}
