import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  input
} from "@angular/core";
import { DatePipe, SlicePipe } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";

import { ChartAttributes } from "../../shared/models/chart";
import { ChartVersion } from "../../shared/models/chart-version";
import { ChartsService } from "../../shared/services/charts.service";

@Component({
  selector: "app-chart-details-versions",
  templateUrl: "./chart-details-versions.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DatePipe, RouterLink, SlicePipe],
})
export class ChartDetailsVersionsComponent {
  readonly versions = input<ChartVersion[]>();
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() currentVersion!: ChartVersion;
  showAllVersions = false;
  private route = inject(ActivatedRoute);
  private chartService = inject(ChartsService);

  goToVersionUrl(version: ChartVersion): string {
    const chart: ChartAttributes = version.relationships.chart.data;
    return this.chartService.getChartSummaryRoute(
      chart.repo.name,
      chart.name,
      version.attributes.version,
      this.route,
    );
  }

  isSelected(version: ChartVersion): boolean {
    return (
      this.currentVersion &&
      version.attributes.version === this.currentVersion.attributes.version
    );
  }

  showMoreLink(): boolean {
    const versions = this.versions();
    return versions && versions.length > 5 && !this.showAllVersions;
  }

  setShowAllVersions() {
    this.showAllVersions = true;
  }

  shownVersions(): ChartVersion[] {
    const versions = this.versions();
    if (versions) {
      return this.showAllVersions
        ? versions
        : this.getNonDevelopmentVersion().slice(0, 5);
    }
    return [];
  }

  getNonDevelopmentVersion(): ChartVersion[] {
    const nonDevel: ChartVersion[] = [];
    for (const version of this.versions()) {
      if (version.attributes.version.indexOf("-") === -1) {
        nonDevel.push(version);
      }
    }
    return nonDevel;
  }
}
