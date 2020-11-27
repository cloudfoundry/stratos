import { Component, OnInit } from '@angular/core';

import { IReportViewer } from '../analysis-report-viewer.component';

@Component({
  selector: 'app-kube-score-report-viewer',
  templateUrl: './kube-score-report-viewer.component.html',
  styleUrls: ['./kube-score-report-viewer.component.scss']
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

  report: any;
  processed: any;

  constructor() { }

  ngOnInit() {
    this.processed = [];
    // Turn the report into an array
    if (this.report) {
      Object.keys(this.report.report).forEach(key => {
        const filtered = this.filter(this.report.report[key]);
        if (filtered.length > 0) {
          this.processed.push({
            ...this.report.report[key],
            _checks: filtered,
            _name: key,
          });
        }
      });
    }
  }

  public filter(report) {
    const filtered = [];
    report.Checks.forEach(r => {
      if (r.Grade !== 10 && !r.Skipped) {
        filtered.push(r);
      }
    });
    return filtered;
  }
}
