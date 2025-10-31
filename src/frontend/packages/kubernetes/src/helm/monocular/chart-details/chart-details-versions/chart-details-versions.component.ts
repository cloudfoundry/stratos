import {Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ChartAttributes } from '../../shared/models/chart';
import { ChartVersion } from '../../shared/models/chart-version';
import { ChartsService } from '../../shared/services/charts.service';

@Component({
  selector: 'app-chart-details-versions',
  templateUrl: './chart-details-versions.component.html',
  styleUrls: ['./chart-details-versions.component.scss'],
  standalone: true
})
export class ChartDetailsVersionsComponent {
  @Input() versions: ChartVersion[];
  @Input() currentVersion: ChartVersion;
  showAllVersions: boolean;
  private route = inject(ActivatedRoute);
  private chartService = inject(ChartsService);

  goToVersionUrl(version: ChartVersion): string {
    const chart: ChartAttributes = version.relationships.chart.data;
    return this.chartService.getChartSummaryRoute(chart.repo.name, chart.name, version.attributes.version, this.route);
  }

  isSelected(version: ChartVersion): boolean {
    return this.currentVersion && version.attributes.version === this.currentVersion.attributes.version;
  }

  showMoreLink(): boolean {
    return this.versions && this.versions.length > 5 && !this.showAllVersions;
  }

  setShowAllVersions() {
    this.showAllVersions = true;
  }

  shownVersions(): ChartVersion[] {
    if (this.versions) {
      return this.showAllVersions ? this.versions : this.getNonDevelopmentVersion().slice(0, 5);
    }
    return [];
  }

  getNonDevelopmentVersion(): ChartVersion[] {
    const nonDevel: ChartVersion[] = [];
    for (const version of this.versions) {
      if (version.attributes.version.indexOf('-') === -1) {
        nonDevel.push(version);
      }
    }
    return nonDevel;
  }
}
