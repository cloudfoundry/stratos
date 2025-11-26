import { type ResourceAlert, ResourceAlertLevel, type ResourceAlertMap } from './analysis-report.types';

interface KubeScoreComment {
  Summary: string;
}

interface KubeScoreCheck {
  Grade: number;
  Skipped: boolean;
  Comments: KubeScoreComment[];
}

interface KubeScoreItem {
  TypeMeta: {
    kind: string;
  };
  ObjectMeta: {
    namespace: string;
    name: string;
  };
  Checks: KubeScoreCheck[];
}

interface KubeScoreReport {
  [key: string]: KubeScoreItem;
}

interface AnalysisReportContainer {
  report?: Record<string, unknown>;
  alerts?: Record<string, unknown>;
}

export class KubeScoreReportHelper {

  constructor(public report: AnalysisReportContainer) {}

  public map(): void {
    if (!this.report.report) {
      return;
    }

    const kubescore = this.report.report as KubeScoreReport;
    // Go through the report and re-map
    const result = {} as ResourceAlertMap;

    Object.keys(kubescore).forEach((key: string) => {
      const item = kubescore[key];
      let id = item.TypeMeta.kind.toLowerCase();
      id = `${id}/${item.ObjectMeta.namespace}/${item.ObjectMeta.name}`;

      item.Checks.forEach((check) => {
        if (check.Grade !== 10 && !check.Skipped) {
          // Add an alert for each comment
          check.Comments.forEach((comment) => {
            // Include this comment
            const alert = {
              kind: item.TypeMeta.kind.toLowerCase(),
              namespace: item.ObjectMeta.namespace,
              name: item.ObjectMeta.name,
              message: comment.Summary,
              level: this.convertMessageLevel(check.Grade)
            } as ResourceAlert;
            if (!result[id]) {
              result[id] = [] as ResourceAlert[];
            }
            result[id].push(alert);
          });
        }
      });
    });
    this.report.alerts = result as Record<string, unknown>;
  }
  private convertMessageLevel(level: number): ResourceAlertLevel {
    switch (level) {
      case 10:
        return ResourceAlertLevel.OK;
      case 7:
        return ResourceAlertLevel.Info;
      case 5:
        return ResourceAlertLevel.Warning;
      case 1:
        return ResourceAlertLevel.Error;
      default:
        return ResourceAlertLevel.Unknown;
    }
  }
}
