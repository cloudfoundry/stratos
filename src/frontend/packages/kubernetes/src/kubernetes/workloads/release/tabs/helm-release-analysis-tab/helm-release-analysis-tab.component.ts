import { CommonModule, AsyncPipe } from '@angular/common';
import {Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { PageSubNavComponent, NoContentMessageComponent } from '@stratosui/core';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer.component';

import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import type { AnalysisReport } from '../../../../store/kube.types';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-analysis-tab',
  templateUrl: './helm-release-analysis-tab.component.html',
  styleUrls: ['./helm-release-analysis-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private reportSignal = signal<AnalysisReport | null>(null);
  public report$ = toObservable(this.reportSignal);

  path: string;

  currentReport: string | null = null;

  noReportsAvailable = false;  public analaysisService = inject(KubernetesAnalysisService);
  public helmReleaseHelper = inject(HelmReleaseHelperService);



  constructor() {


    this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;


  }

  public analysisChanged(report: { id: string }) {
    if (report.id !== this.currentReport) {
      this.currentReport = report.id;
      this.analaysisService.getByID(this.helmReleaseHelper.endpointGuid, report.id).subscribe((r: AnalysisReport) => this.reportSignal.set(r));
    }
  }

  public onReportCount(count: number) {
    this.noReportsAvailable = count === 0;
  }

}
