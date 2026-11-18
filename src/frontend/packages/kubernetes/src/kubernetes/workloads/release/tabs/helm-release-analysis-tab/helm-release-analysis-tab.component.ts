import {Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';

import { PageSubNavComponent, NoContentMessageComponent } from '@stratosui/core';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer.component';

import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { AnalysisReport } from '../../../../store/kube.types';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-analysis-tab',
  templateUrl: './helm-release-analysis-tab.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageSubNavComponent,
    NoContentMessageComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    AnalysisReportViewerComponent
  ]
})
export class HelmReleaseAnalysisTabComponent {

  readonly report = signal<AnalysisReport | null>(null);

  path: string;

  currentReport: AnalysisReport | null = null;

  noReportsAvailable = false;  public analaysisService = inject(KubernetesAnalysisService);
  public helmReleaseHelper = inject(HelmReleaseHelperService);



  constructor() {


    this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;


  }

  public analysisChanged(report: any) {
    if (report.id !== this.currentReport) {
      this.currentReport = report.id;
      this.analaysisService.getByID(this.helmReleaseHelper.endpointGuid, report.id).subscribe((r: any) => this.report.set(r));
    }
  }

  public onReportCount(count: number) {
    this.noReportsAvailable = count === 0;
  }

}
