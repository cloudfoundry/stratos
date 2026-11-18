
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, signal, input, untracked } from '@angular/core';
import { CardWrapperComponent, UrlPartsPipe } from '@stratosui/core';
import { of } from 'rxjs';
import { take, catchError,  } from 'rxjs/operators';

import { Chart } from '../../shared/models/chart';
import { ChartVersion } from '../../shared/models/chart-version';
import { Maintainer } from '../../shared/models/maintainer';
import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsUsageComponent } from '../chart-details-usage/chart-details-usage.component';
import { ChartDetailsVersionsComponent } from '../chart-details-versions/chart-details-versions.component';

@Component({
  selector: 'app-chart-details-info',
  templateUrl: './chart-details-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CardWrapperComponent,
    ChartDetailsUsageComponent,
    ChartDetailsVersionsComponent,
    UrlPartsPipe,
]
})
export class ChartDetailsInfoComponent implements OnInit {
  readonly chart = input.required<Chart>();
  // Signals: both arrive from HTTP after the first render, and an OnPush view
  // under zoneless CD only repaints for signal writes.
  readonly versions = signal<ChartVersion[]>([]);
  readonly schema = signal<unknown>(null);

  // Its one host (chart-details) binds it inside @if (currentVersion()).
  readonly currentVersion = input.required<ChartVersion>();

  private chartsService = inject(ChartsService);

  constructor() {
    // Load the values schema of each version shown. Only a new version loads
    // it again, so the chart is read untracked.
    effect(() => {
      const version = this.currentVersion();
      if (version) {
        untracked(() => this.getSchema(version, this.chart()));
      }
    });
  }

  ngOnInit() {
    this.loadVersions(this.chart());
  }

  get sources() {
    return this.chart().attributes.sources || [];
  }

  get maintainers(): Maintainer[] {
    return this.chart().attributes.maintainers || [];
  }

  loadVersions(chart: Chart): void {
    this.chartsService
      .getVersions(chart.attributes.repo.name, chart.attributes.name)
      .subscribe(versions => {
        this.versions.set(versions);
      });
  }

  maintainerUrl(maintainer: Maintainer): string {
    // Use GitHub URL with maintainer name if this is an upstream Helm repo from
    // github.com/helm/charts (i.e. stable or incubator)
    if (this.isUpstreamHelmRepo(this.chart().attributes.repo.url)) {
      return `https://github.com/${maintainer.name}`;
    } else {
      return `mailto:${maintainer.email}`;
    }
  }

  private isUpstreamHelmRepo(repoURL: string): boolean {
    return (
      repoURL === 'https://kubernetes-charts.storage.googleapis.com' ||
      repoURL === 'https://kubernetes-charts-incubator.storage.googleapis.com'
    );
  }

  private getSchema(currentVersion: ChartVersion, chart: Chart) {
    this.chartsService.getChartSchema(currentVersion, chart).pipe(
      take(1),
      catchError(() => of(null))
    ).subscribe(schema => {
      this.schema.set(schema);
    });
  }

}
