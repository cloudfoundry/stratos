import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HomePageCardLayout } from '../../../../core/src/features/home/home.types';
import { EndpointModel } from '../../../../store/src/public-api';
import { kubeEntityCatalog } from '../kubernetes-entity-catalog';

@Component({
  selector: 'app-k8s-home-card',
  templateUrl: './kubernetes-home-card.component.html',
  styleUrls: ['./kubernetes-home-card.component.scss'],
  providers: [
    // {
    //   provide: ActiveRouteCfOrgSpace,
    //   useValue: null,
    // },
  ]
})
export class KubernetesHomeCardComponent implements OnInit {

  @Input() endpoint: EndpointModel;

  _layout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this._layout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this._layout = value;
    }
  };

  public podCount$: Observable<number>;
  public nodeCount$: Observable<number>;
  public namespaceCount$: Observable<number>;

  constructor() {}

  ngOnInit() {
    const guid = this.endpoint.guid;

    const podsObs = kubeEntityCatalog.pod.store.getPaginationService(guid);
    const pods$ = podsObs.entities$;
    const nodesObs = kubeEntityCatalog.node.store.getPaginationService(guid);
    const nodes$ = nodesObs.entities$;
    const namespacesObs = kubeEntityCatalog.namespace.store.getPaginationService(guid);
    const namespaces$ = namespacesObs.entities$;

    this.podCount$ = pods$.pipe(map(entities => entities.length));
    this.nodeCount$ = nodes$.pipe(map(entities => entities.length));
    this.namespaceCount$ = namespaces$.pipe(map(entities => entities.length));
  }

}
