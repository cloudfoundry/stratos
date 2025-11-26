import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  type ComponentRef,
  Input,
  type OnDestroy,
  type Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import type { AnalysisReport } from '../store/kube.types';
import { KubeScoreReportViewerComponent } from './kube-score-report-viewer/kube-score-report-viewer.component';
import { PopeyeReportViewerComponent } from './popeye-report-viewer/popeye-report-viewer.component';

export interface IReportViewer {
  report: AnalysisReport;
}

@Component({
selector: 'app-analysis-report-viewer',
  templateUrl: './analysis-report-viewer.component.html',
  styleUrls: ['./analysis-report-viewer.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysisReportViewerComponent implements OnDestroy {

  // Component reference for the dynamically created auth form
  @ViewChild('reportViewer', { read: ViewContainerRef, static: true })
  public container: ViewContainerRef;
  private reportComponentRef: ComponentRef<IReportViewer>;

  private id!: string;

  constructor(private cdr: ChangeDetectorRef) {}

  @Input('report')
  set report(report: AnalysisReport) {
    if (report === null || report.id === this.id) {
      return;
    }
    this.id = report.id;
    this.updateReport(report);
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
    if (!component || !this.container) {
      return;
    }

    if (this.reportComponentRef) {
      this.reportComponentRef.destroy();
    }
    this.reportComponentRef = this.container.createComponent<IReportViewer>(component);
    // this.reportComponentRef.instance.setReport(report);
    this.reportComponentRef.instance.report = report;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.reportComponentRef) {
      this.reportComponentRef.destroy();
    }
  }
}
