import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Subject } from 'rxjs';

import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { NoContentMessageComponent } from '../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer/analysis-report-viewer.component';

import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { AnalysisReport } from '../../../../store/kube.types';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-analysis-tab',
  templateUrl: './helm-release-analysis-tab.component.html',
  styleUrls: ['./helm-release-analysis-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    NoContentMessageComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    AnalysisReportViewerComponent
  ]
})
export class HelmReleaseAnalysisTabComponent {

  public report$ = new Subject<AnalysisReport>();

  path: string;

  currentReport = null;

  noReportsAvailable = false;

  constructor(
    public analaysisService: KubernetesAnalysisService,
    public helmReleaseHelper: HelmReleaseHelperService
  ) {
    this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;
  }

  public analysisChanged(report) {
    if (report.id !== this.currentReport) {
      this.currentReport = report.id;
      this.analaysisService.getByID(this.helmReleaseHelper.endpointGuid, report.id).subscribe(r => this.report$.next(r));
    }
  }

  public onReportCount(count: number) {
    this.noReportsAvailable = count === 0;
  }

}
