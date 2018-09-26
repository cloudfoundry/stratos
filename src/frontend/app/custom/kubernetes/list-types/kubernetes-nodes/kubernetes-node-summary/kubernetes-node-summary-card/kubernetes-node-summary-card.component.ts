import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { KubernetesNode } from '../../../../store/kube.types';
import { AppChip } from '../../../../../../shared/components/chips/chips.component';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-kubernetes-node-summary-card',
  templateUrl: './kubernetes-node-summary-card.component.html',
  styleUrls: ['./kubernetes-node-summary-card.component.scss']
})
export class KubernetesNodeSummaryCardComponent implements OnInit {
  node$: Observable<KubernetesNode>;
  labels$: Observable<AppChip[]>;
  annotations$: Observable<AppChip[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {

    this.node$ = this.kubeNodeService.node$.pipe(
      map(p => p.entity)
    );
    this.labels$ = this.node$.pipe(
      map(node => {
        return this.getTags(node.metadata.labels);
      })
    );
    this.annotations$ = this.node$.pipe(
      map(node => {
        return this.getTags(node.metadata.annotations);
      })
    );

  }


  private getTags(tags: {}) {
    const labelEntries = Object.entries(tags);
    return labelEntries.map(t => ({
      value: `${t[0]}:${t[1]}`
    }));
  }
}
