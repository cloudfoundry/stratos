import {Component, OnInit, computed, inject, ChangeDetectionStrategy, Signal } from '@angular/core';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNamespace } from '../../../store/kube.types';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';

@Component({
  selector: 'app-kube-namespace-pod-count',
  templateUrl: './kube-namespace-pod-count.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class KubeNamespacePodCountComponent extends TableCellCustom<KubernetesNamespace> implements OnInit {
  podCount: Signal<number>;
  private kubeEndpointService = inject(KubernetesEndpointService);
  private podData = inject(KubePodDataService);

  ngOnInit() {
    // Wave-3.5: read from the signal-native pod data service rather
    // than the deleted ngrx-backed pods$ on KubernetesEndpointService.
    const pods = this.podData.podsInCluster(this.kubeEndpointService.kubeGuid);
    this.podCount = computed(() => {
      const rowName = this.row?.metadata?.name;
      return pods().filter(p => p.metadata?.namespace === rowName).length;
    });
  }

}
