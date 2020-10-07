import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { AnalysisReport } from '../store/kube.types';
import { KubeScoreReportViewerComponent } from './kube-score-report-viewer/kube-score-report-viewer.component';
import { PopeyeReportViewerComponent } from './popeye-report-viewer/popeye-report-viewer.component';

export interface IReportViewer {
  report: AnalysisReport;
}

@Component({
  selector: 'app-analysis-report-viewer',
  templateUrl: './analysis-report-viewer.component.html',
  styleUrls: ['./analysis-report-viewer.component.scss']
})
export class AnalysisReportViewerComponent implements OnDestroy {

  // Component reference for the dynamically created auth form
  @ViewChild('reportViewer', { read: ViewContainerRef, static: true })
  public container: ViewContainerRef;
  private reportComponentRef: ComponentRef<IReportViewer>;

  private id: string;

  @Input('report')
  set report(report: AnalysisReport) {
    if (report === null || report.id === this.id) {
      return;
    }
    this.id = report.id;
    this.updateReport(report);
  }

  constructor(private resolver: ComponentFactoryResolver) { }

  updateReport(report) {
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
    const factory = this.resolver.resolveComponentFactory<IReportViewer>(component);
    this.reportComponentRef = this.container.createComponent<IReportViewer>(factory);
    // this.reportComponentRef.instance.setReport(report);
    this.reportComponentRef.instance.report = report;
  }

  ngOnDestroy() {
    if (this.reportComponentRef) {
      this.reportComponentRef.destroy();
    }
  }
}
