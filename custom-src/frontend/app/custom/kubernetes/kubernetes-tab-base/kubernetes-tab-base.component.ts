import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesService } from '../services/kubernetes.service';

function getKubeIdFromUrl(activatedRoute: ActivatedRoute) {
  console.log('GUID for BaseKubeGuid');
  console.log(activatedRoute.snapshot.params.kubeId);
  return {
    guid: activatedRoute.snapshot.params.kubeId
  };
}

@Component({
  selector: 'app-kubernetes-tab-base',
  templateUrl: './kubernetes-tab-base.component.html',
  styleUrls: ['./kubernetes-tab-base.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: getKubeIdFromUrl,
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService,
  ]
})
export class KubernetesTabBaseComponent implements OnInit {

  tabLinks = [
    { link: 'nodes', label: 'Nodes' },
    { link: 'pods', label: 'Pods' },
  ];

  isFetching$: Observable<boolean>;

  constructor(private kubeEndpointService: KubernetesEndpointService) { }

  ngOnInit() {
    this.isFetching$ = Observable.of(false);
  }

}
