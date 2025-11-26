import { AsyncPipe } from '@angular/common';
import {Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TableCellCustom } from '@stratosui/core';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import type { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-node-pod-count',
  templateUrl: './node-pod-count.component.html',
  styleUrls: ['./node-pod-count.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe]
})
export class NodePodCountComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  podCount$: Observable<string>;
  private kubeEndpointService = inject(KubernetesEndpointService);

  ngOnInit() {

    this.podCount$ = this.kubeEndpointService.pods$.pipe(
      map(pods => pods.filter(p => p.spec.nodeName === this.row.metadata.name)),
      map(p => `${p.length} / ${this.row.status.capacity.pods}`)
    );
  }

}
