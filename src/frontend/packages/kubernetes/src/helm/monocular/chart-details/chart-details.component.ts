
import {Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { take, finalize, switchMap, tap } from 'rxjs/operators';

import { EntitySummaryTitleComponent } from '@stratosui/core';

import { Chart } from '../shared/models/chart';
import { ChartVersion } from '../shared/models/chart-version';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { getMonocularEndpoint, stratosMonocularEndpointGuid } from '../stratos-monocular.helper';
import { LoaderComponent } from '../loader/loader.component';
import { PanelComponent } from '../panel/panel.component';
import { ChartDetailsInfoComponent } from './chart-details-info/chart-details-info.component';
import { ChartDetailsReadmeComponent } from './chart-details-readme/chart-details-readme.component';

@Component({
  selector: 'app-chart-details',
  templateUrl: './chart-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    EntitySummaryTitleComponent,
    LoaderComponent,
    PanelComponent,
    ChartDetailsInfoComponent,
    ChartDetailsReadmeComponent
]
})
export class ChartDetailsComponent implements OnInit {
  /* This resource will be different, probably ChartVersion */
  chart = signal<Chart | undefined>(undefined);
  // Nothing renders until the chart arrives, so show the spinner from the start
  loading = signal(true);
  initing = signal(true);
  currentVersion = signal<ChartVersion | undefined>(undefined);
  iconUrl = signal('');
  titleVersion = '';
  chartSubTitle = signal('');

  private route = inject(ActivatedRoute);
  private chartsService = inject(ChartsService);
  private config = inject(ConfigService);

  ngOnInit() {
    this.route.params.forEach((params: Params) => {
      const repo = params.repo;
      const chartName = params.chartName;

      if (chartName) {
        this.loading.set(true);
        this.chartsService.getChart(repo, chartName).pipe(
          take(1),
          switchMap(chart => {
            this.chart.set(chart);
            let subTitle = chart.attributes.repo.name;
            if (getMonocularEndpoint(this.route, chart) !== stratosMonocularEndpointGuid) {
              subTitle = 'Artifact Hub - ' + subTitle;
            }
            this.chartSubTitle.set(subTitle);
            const version = params.version || chart.relationships.latestChartVersion.data.version;
            return this.chartsService.getVersion(repo, chartName, version).pipe(take(1));
          }),
          tap(chartVersion => {
            this.currentVersion.set(chartVersion);
            this.titleVersion = chartVersion.attributes.app_version || '';
            this.updateMetaTags();
            this.iconUrl.set(this.chartsService.getChartIconURL(this.chart()!, chartVersion));
          }),
          finalize(() => {
            this.loading.set(false);
            this.initing.set(false);
          })
        ).subscribe();
      }
    });
  }

  // TODO: See #150 - Is this to be implemented?
  /**
   * Update the metatags with the name and the description of the application.
   */
  updateMetaTags(): void { }

  goToRepoUrl(): string {
    const chart = this.chart()!;
    return `/charts/${getMonocularEndpoint(undefined, chart)}/${chart.attributes.repo.name}`;
  }
}
