import { Component, OnInit } from '@angular/core';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { KubernetesNode, Condition, ConditionType } from '../../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-condition-card',
  templateUrl: './kubernetes-node-condition-card.component.html',
  styleUrls: ['./kubernetes-node-condition-card.component.scss']
})
export class KubernetesNodeConditionCardComponent implements OnInit {
  node$: Observable<KubernetesNode>;
  condition$: Observable<Condition[]>;
  outOfDisk$: Observable<Condition>;
  diskPressure$: Observable<Condition>;
  memoryPressure$: Observable<Condition>;
  ready$: Observable<Condition>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {

    this.node$ = this.kubeNodeService.node$.pipe(
      map(p => p.entity)
    );
    this.condition$ = this.node$.pipe(
      map(node => node.status.conditions)
    );

  }

}
