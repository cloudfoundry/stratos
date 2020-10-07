import { Component, OnInit } from '@angular/core';

import { IReportViewer } from '../analysis-report-viewer.component';

@Component({
  selector: 'app-popeye-report-viewer',
  templateUrl: './popeye-report-viewer.component.html',
  styleUrls: ['./popeye-report-viewer.component.scss']
})
export class PopeyeReportViewerComponent implements OnInit, IReportViewer {

  report: any;
  processed: any;

  ngOnInit() {
    this.processed = this.apply(this.report);
  }

  private apply(response) {
    if (response) {
      // In order to supplement the sanitizers with extra properties need to create new obj (see spread below and `reduce`)
      response = {
        ...response,
        report: {
          ...response.report,
          popeye: {
            ...response.report.popeye
          }
        }
      }
      // Make the response easier to render
      response.report.popeye.sanitizers = response.report.popeye.sanitizers.reduce((ss, oldS) => {
        const s = { ...oldS }
        const groups = [];
        let totalIssues = 0;
        if (s.issues) {
          Object.keys(s.issues).forEach(key => {
            const issues = s.issues[key];
            totalIssues += issues.length;
            if (issues.length > 0) {
              groups.push({
                name: key,
                issues
              });
            }
          });
          s.hide = totalIssues === 0;
        } else {
          s.hide = true;
        }
        s.groups = groups;
        ss.push(s);
        return ss;
      }, []);

      return response.report;
    }
  }
}
