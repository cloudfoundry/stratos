import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';

import { AnalysisReportsListConfig } from '../../list-types/analysis-reports-list-config.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { ListComponent } from 'frontend/packages/core/src/shared/components/list/list.component';
import { PageSubNavComponent } from 'frontend/packages/core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { AnalysisReportRunnerComponent } from '../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';

@Component({
  selector: 'app-kubernetes-analysis-tab',
  templateUrl: './kubernetes-analysis-tab.component.html',
  styleUrls: ['./kubernetes-analysis-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ListComponent,
    PageSubNavComponent,
    AnalysisReportRunnerComponent
  ],
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
