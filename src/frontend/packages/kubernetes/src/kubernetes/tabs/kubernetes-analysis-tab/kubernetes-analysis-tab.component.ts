import {Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ListConfig } from '@stratosui/core';

import { AnalysisReportsListConfig } from '../../list-types/analysis-reports-list-config.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { ListComponent } from '@stratosui/core';
import { PageSubNavComponent } from '@stratosui/core';
import { AnalysisReportRunnerComponent } from '../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';

@Component({
  selector: 'app-kubernetes-analysis-tab',
  templateUrl: './kubernetes-analysis-tab.component.html',
  styleUrls: ['./kubernetes-analysis-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
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
export class KubernetesAnalysisTabComponent {  public kubeEndpointService = inject(KubernetesEndpointService);

}
