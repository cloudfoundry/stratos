import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Subject } from 'rxjs';

import { PageSubNavComponent } from '../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { NoContentMessageComponent } from '../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { AnalysisReportRunnerComponent } from '../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesService } from '../../services/kubernetes.service';
import { AnalysisReport } from '../../store/kube.types';

@Component({
selector: 'app-kubernetes-namespace-analysis-report-tab',
  templateUrl: './kubernetes-namespace-analysis-report.component.html',
  styleUrls: ['./kubernetes-namespace-analysis-report.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    PageSubNavComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    AnalysisReportViewerComponent,
    NoContentMessageComponent
  ],
  providers: [
    KubernetesService,
    KubernetesEndpointService,
    KubernetesNamespaceService,
    KubernetesAnalysisService,
  ]
})
export class KubernetesNamespaceAnalysisReportComponent {

  public report$ = new Subject<AnalysisReport>();

  path: string;

  currentReport = null;

  endpointID: string;

  noReportsAvailable = false;

  breadcrumbs = [];

  constructor(
    public analyzerService: KubernetesAnalysisService,
    public endpointService: KubernetesEndpointService,
    public kubeNamespaceService: KubernetesNamespaceService,
  ) {
    this.endpointID = this.endpointService.kubeGuid;
    this.path = `${this.kubeNamespaceService.namespaceName}`;
    this.report$.next(null);

    this.breadcrumbs = [
      { value: 'Analysis' },
      { value: this.path },
    ];

  }

  public analysisChanged(report) {
    if (report.id !== this.currentReport) {
      this.currentReport = report.id;
      this.analyzerService.getByID(this.endpointID, report.id).subscribe(r => this.report$.next(r));
    }
  }

  public onReportCount(count: number) {
    this.noReportsAvailable = count === 0;
  }

}
