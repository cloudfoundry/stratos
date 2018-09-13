import { Component, OnInit } from '@angular/core';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { Observable, of as ObservableOf } from 'rxjs';
import { HelmReleaseService } from '../services/helm-release.service';

@Component({
  selector: 'app-helm-release',
  templateUrl: './helm-release.component.html',
  styleUrls: ['./helm-release.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.kubeId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    HelmReleaseService,
    KubernetesEndpointService
  ]
})
export class HelmReleaseComponent implements OnInit {

  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'pods', label: 'Pods' },
    { link: 'services', label: 'Services' },
  ];

  isFetching$: Observable<boolean>;
  constructor(public kubeEndpointService: KubernetesEndpointService, public helmReleaseService: HelmReleaseService) {
  }

  ngOnInit() {
    this.isFetching$ = ObservableOf(false);
  }

}
