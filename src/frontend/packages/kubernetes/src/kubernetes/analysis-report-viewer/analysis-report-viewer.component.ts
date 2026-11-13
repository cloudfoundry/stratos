import { ChangeDetectionStrategy, Component, ComponentRef, OnDestroy, Type, ViewContainerRef, effect, input, untracked, viewChild } from '@angular/core';

import { AnalysisReport } from '../store/kube.types';
import { KubeScoreReportViewerComponent } from './kube-score-report-viewer/kube-score-report-viewer.component';
import { PopeyeReportViewerComponent } from './popeye-report-viewer/popeye-report-viewer.component';

export interface IReportViewer {
  report: AnalysisReport;
}

@Component({
selector: 'app-analysis-report-viewer',
  templateUrl: './analysis-report-viewer.component.html',

  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysisReportViewerComponent implements OnDestroy {


  // Component reference for the dynamically created auth form
  // Optional: createComponent guards for a container that is not there yet.
  public readonly container = viewChild('reportViewer', { read: ViewContainerRef });
  private reportComponentRef?: ComponentRef<IReportViewer>;

  private id!: string;

  readonly report = input<AnalysisReport | null>();

  constructor() {
    // Show a viewer for each new report; the same report again keeps its viewer.
    effect(() => {
      const report = this.report();
      if (!report || report.id === this.id) {
        return;
      }
      this.id = report.id;
      // Untracked: signals the new viewer reads while it is created are not
      // dependencies of this effect.
      untracked(() => this.updateReport(report));
    });
  }

  updateReport(report: AnalysisReport): void {
    switch (report.format) {
      case 'popeye':
        this.createComponent(PopeyeReportViewerComponent, report);
        break;
      case 'kubescore':
        this.createComponent(KubeScoreReportViewerComponent, report);
        break;
    }
  }

  // Dynamically create the component for the report type type
  createComponent(component: Type<IReportViewer>, report: AnalysisReport) {
    const container = this.container();
    if (!component || !container) {
      return;
    }

    if (this.reportComponentRef) {
      this.reportComponentRef.destroy();
    }
    this.reportComponentRef = container.createComponent<IReportViewer>(component);
    // this.reportComponentRef.instance.setReport(report);
    this.reportComponentRef.instance.report = report;
  }

  ngOnDestroy() {
    if (this.reportComponentRef) {
      this.reportComponentRef.destroy();
    }
  }
}
