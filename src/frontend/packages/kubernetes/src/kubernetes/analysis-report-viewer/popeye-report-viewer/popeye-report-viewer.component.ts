import { ChangeDetectionStrategy, Component, type OnInit} from '@angular/core';


import type { AnalysisReport } from '../../store/kube.types';
import type { IReportViewer } from '../analysis-report-viewer.component';

interface PopeyeSanitizer {
  issues?: Record<string, unknown[]>;
  hide?: boolean;
  groups?: Array<{ name: string; issues: unknown[] }>;
}

interface ProcessedPopeyeReport {
  report: {
    popeye: {
      sanitizers: PopeyeSanitizer[];
    };
  };
}

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-popeye-report-viewer',
  templateUrl: './popeye-report-viewer.component.html',
  styleUrls: ['./popeye-report-viewer.component.scss'],
  standalone: true,
  imports: []
})
export class PopeyeReportViewerComponent implements OnInit, IReportViewer {

  report!: AnalysisReport;
  processed: unknown;

  ngOnInit() {
    this.processed = this.apply(this.report);
  }

  private apply(response: AnalysisReport): unknown {
    const reportData = response.report as { popeye?: { sanitizers?: unknown[] } } | undefined;
    if (reportData?.popeye?.sanitizers) {
      // In order to supplement the sanitizers with extra properties need to create new obj (see spread below and `reduce`)
      const processedResponse: ProcessedPopeyeReport = {
        ...response,
        report: {
          ...reportData,
          popeye: {
            ...reportData.popeye,
            sanitizers: reportData.popeye.sanitizers
          }
        }
      } as ProcessedPopeyeReport;
      // Make the response easier to render
      processedResponse.report.popeye.sanitizers = (processedResponse.report.popeye.sanitizers || []).reduce((ss: PopeyeSanitizer[], oldS: { issues?: Record<string, unknown[]> }) => {
        const s: PopeyeSanitizer = { ...oldS };
        const groups: Array<{ name: string; issues: unknown[] }> = [];
        let totalIssues = 0;
        if (s.issues) {
          Object.keys(s.issues).forEach((key: string) => {
            const issues = s.issues?.[key];
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
      }, [] as PopeyeSanitizer[]);

      return processedResponse.report;
    }
    return undefined;
  }
}
