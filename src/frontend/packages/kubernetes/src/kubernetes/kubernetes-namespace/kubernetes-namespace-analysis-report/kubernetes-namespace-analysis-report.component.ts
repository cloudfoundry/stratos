import { AsyncPipe } from '@angular/common';
import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
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

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
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

  path: string | undefined;

  currentReport: string | null = null;

  endpointID: string;

  noReportsAvailable = false;

  breadcrumbs: Array<{ value: string }> = [];
  public analyzerService = inject(KubernetesAnalysisService);
  public endpointService = inject(KubernetesEndpointService);
  public kubeNamespaceService = inject(KubernetesNamespaceService);



  constructor() {


    this.endpointID = this.endpointService.kubeGuid;
    this.path = `${this.kubeNamespaceService.namespaceName}`;
    this.report$.next(null);

    this.breadcrumbs = [
      { value: 'Analysis' },
      { value: this.path },
    ];


  }

  public analysisChanged(report: AnalysisReport | null) {
    if (report?.id !== this.currentReport) {
      this.currentReport = report?.id || null;
      if (report?.id) {
        this.analyzerService.getByID(this.endpointID, report.id).subscribe((r: AnalysisReport) => this.report$.next(r));
      }
    }
  }

  public onReportCount(count: number) {
    this.noReportsAvailable = count === 0;
  }

}
