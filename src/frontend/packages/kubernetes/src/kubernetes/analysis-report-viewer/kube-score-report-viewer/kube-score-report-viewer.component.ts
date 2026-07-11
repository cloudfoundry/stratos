import { ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

import { AnalysisReport } from '../../store/kube.types';
import { IReportViewer } from '../analysis-report-viewer.component';

interface KubeScoreCheck {
  Grade?: number;
  Skipped?: boolean;
  Check?: { Name?: string };
  Comments?: Array<{ Summary?: string }>;
}

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-score-report-viewer',
  templateUrl: './kube-score-report-viewer.component.html',
  standalone: true
})
export class KubeScoreReportViewerComponent implements OnInit, IReportViewer {

  /*
    Kube Score grading

    See: https://github.com/zegl/kube-score/blob/eca7bda47f5b3c523a0f41945cb1adda0a4e2e2e/scorecard/scorecard.go
    GradeCritical Grade = 1
    GradeWarning  Grade = 5
    GradeAlmostOK Grade = 7
    GradeAllOK    Grade = 10
  */

  report!: AnalysisReport;
  processed: Array<{ _checks: KubeScoreCheck[]; _name: string }> = [];

  constructor() { }

  ngOnInit() {
    this.processed = [];
    // Turn the report into an array
    if (this.report?.report) {
      const reportData = this.report.report as Record<string, { Checks?: KubeScoreCheck[] }>;
      Object.keys(reportData).forEach(key => {
        const filtered = this.filter(reportData[key]);
        if (filtered.length > 0) {
          this.processed.push({
            ...reportData[key],
            _checks: filtered,
            _name: key,
          });
        }
      });
    }
  }

  public filter(report: { Checks?: KubeScoreCheck[] }): KubeScoreCheck[] {
    const filtered: KubeScoreCheck[] = [];
    if (report.Checks) {
      report.Checks.forEach(r => {
        if (r.Grade !== 10 && !r.Skipped) {
          filtered.push(r);
        }
      });
    }
    return filtered;
  }
}
