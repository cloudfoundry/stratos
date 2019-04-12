import { Component, Input } from '@angular/core';

import { ChartAttributes } from '../../shared/models/chart';
import { ChartVersion } from '../../shared/models/chart-version';

@Component({
  selector: 'app-chart-details-versions',
  templateUrl: './chart-details-versions.component.html',
  styleUrls: ['./chart-details-versions.component.scss']
})
export class ChartDetailsVersionsComponent {
  @Input() versions: ChartVersion[];
  @Input() currentVersion: ChartVersion;
  showAllVersions: boolean;

  goToVersionUrl(version: ChartVersion): string {
    const chart: ChartAttributes = version.relationships.chart.data;
    return `/monocular/charts/${chart.repo.name}/${chart.name}/${version.attributes.version}`;
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
      return this.showAllVersions ? this.versions : this.versions.slice(0, 5);
    }
    return [];
  }
}
