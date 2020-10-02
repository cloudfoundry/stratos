import { ResourceAlert, ResourceAlertLevel, ResourceAlertMap } from './analysis-report.types';

export class PopeyeReportHelper {

  constructor(public report: any) { }

  // Map the report to the alert format
  public map() {
    if (!this.report.report || !this.report.report.popeye) {
      return;
    }

    const popeye = this.report.report.popeye;
    // Go through the report and re-map
    const result = {} as ResourceAlertMap;
    popeye.sanitizers.forEach(s => {
      // We just care about issues
      const resourceType = s.sanitizer;
      if (s.issues) {
        Object.keys(s.issues).forEach(resourcePath => {
          const issues = s.issues[resourcePath];
          issues.forEach(issue => {
            // Level must be greater than 0 (OK)
            if (issue.level > 0) {
              let namespace;
              let name;
              if (resourcePath.indexOf('/') !== -1) {
                // Has a namespace
                namespace = resourcePath.split('/')[0];
                name = resourcePath.split('/')[1];
              } else {
                name = resourcePath;
                namespace = '';
              }
              const alert = {
                kind: resourceType,
                namespace,
                name,
                message: issue.message,
                level: this.convertMessageLevel(issue.level)
              } as ResourceAlert;
              const id = `${resourceType}/${resourcePath}`;
              if (!result[id]) {
                result[id] = [] as ResourceAlert[];
              }
              result[id].push(alert);
            }
          });
        });
      }
    });

    this.report.alerts = result;
  }
  private convertMessageLevel(level: number): ResourceAlertLevel {
    switch (level) {
      case 0:
        return ResourceAlertLevel.OK;
      case 1:
        return ResourceAlertLevel.Info;
      case 2:
        return ResourceAlertLevel.Warning;
      case 3:
        return ResourceAlertLevel.Error;
      default:
        return ResourceAlertLevel.Unknown;
    }
  }
}
