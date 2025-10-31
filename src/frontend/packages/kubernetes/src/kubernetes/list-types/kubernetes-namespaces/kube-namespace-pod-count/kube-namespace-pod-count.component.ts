import { AsyncPipe } from '@angular/common';
import {Component, OnInit, inject} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNamespace } from '../../../store/kube.types';

@Component({
  selector: 'app-kube-namespace-pod-count',
  templateUrl: './kube-namespace-pod-count.component.html',
  styleUrls: ['./kube-namespace-pod-count.component.scss'],
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
