import { Component } from '@angular/core';
import { ListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';

import { AnalysisReportsListConfig } from '../../list-types/analysis-reports-list-config.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';

@Component({
  selector: 'app-kubernetes-analysis-tab',
  templateUrl: './kubernetes-analysis-tab.component.html',
  styleUrls: ['./kubernetes-analysis-tab.component.scss'],
  providers: [
    KubernetesAnalysisService,
    {
      provide: ListConfig,
      useClass: AnalysisReportsListConfig,
    }
  ]
})
export class KubernetesAnalysisTabComponent {

  constructor(public kubeEndpointService: KubernetesEndpointService) { }

}
