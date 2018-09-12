import { Component, OnInit } from '@angular/core';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { HelmReleasePodsListConfigService } from '../../../list-types/helm-release-pods/helm-release-pods-list-config.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
@Component({
  selector: 'app-helm-release-pods',
  templateUrl: './helm-release-pods.component.html',
  styleUrls: ['./helm-release-pods.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmReleasePodsListConfigService,
  }]
})
export class HelmReleasePodsComponent implements OnInit {

  public metric: string;
  constructor(public kubeEndpointService: KubernetesEndpointService) {
    this.metric = 'container_memory_usage_bytes{pod_name="imprecise-pig-prometheus-kube-state-metrics-8546b989c5-xptls"}[1h]';
   }

  ngOnInit() { }

}