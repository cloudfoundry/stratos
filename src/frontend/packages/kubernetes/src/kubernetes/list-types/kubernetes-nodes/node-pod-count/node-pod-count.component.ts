import {Component, OnInit, computed, inject, ChangeDetectionStrategy, Signal } from '@angular/core';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNode } from '../../../store/kube.types';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';

@Component({
  selector: 'app-node-pod-count',
  templateUrl: './node-pod-count.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class NodePodCountComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  podCount: Signal<string>;
  private kubeEndpointService = inject(KubernetesEndpointService);
  private podData = inject(KubePodDataService);

  ngOnInit() {
    // Wave-3.5: read from the signal-native pod data service rather
    // than the deleted ngrx-backed pods$ on KubernetesEndpointService.
    const pods = this.podData.podsInCluster(this.kubeEndpointService.kubeGuid);
    this.podCount = computed(() => {
      const rowName = this.row?.metadata?.name;
      const filtered = pods().filter(p => p.spec?.nodeName === rowName);
      const cap = this.row?.status?.capacity?.pods ?? '';
      return `${filtered.length} / ${cap}`;
    });
  }

}
