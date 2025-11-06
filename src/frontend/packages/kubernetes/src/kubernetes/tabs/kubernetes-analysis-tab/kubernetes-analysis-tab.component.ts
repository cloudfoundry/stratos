import {Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ListConfig } from 'src/frontend/packages/core/src/shared/components/list/list.component.types';

import { AnalysisReportsListConfig } from '../../list-types/analysis-reports-list-config.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { ListComponent } from 'src/frontend/packages/core/src/shared/components/list/list.component';
import { PageSubNavComponent } from 'src/frontend/packages/core/src/shared/components/page-sub-nav/page-sub-nav.component';
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
