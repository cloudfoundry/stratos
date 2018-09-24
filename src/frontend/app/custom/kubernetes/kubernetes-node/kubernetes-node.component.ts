import { Component, OnInit } from '@angular/core';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node',
  templateUrl: './kubernetes-node.component.html',
  styleUrls: ['./kubernetes-node.component.scss'],
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
    KubernetesEndpointService,
    KubernetesNodeService
  ]
})
export class KubernetesNodeComponent implements OnInit {

  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'metrics', label: 'Metrics' },
    { link: 'pods', label: 'Pods' },
  ];


  constructor(
    private kubeEndpointService: KubernetesEndpointService,
    private kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {
  }

}
