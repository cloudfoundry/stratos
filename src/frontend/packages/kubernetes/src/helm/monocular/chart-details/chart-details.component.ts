
import {Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./chart-details.component.scss'],
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
  chart!: Chart;
  loading = false;
  initing = true;
  currentVersion!: ChartVersion;
  iconUrl!: string;
  titleVersion!: string;
  chartSubTitle!: string;

  loadingDelay: ReturnType<typeof setTimeout>;
  private route = inject(ActivatedRoute);
  private chartsService = inject(ChartsService);
  private config = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);



  constructor() {


    this.loadingDelay = setTimeout(() => this.loading = true, 100);


  }

  ngOnInit() {
    this.route.params.forEach((params: Params) => {
      const repo = params.repo;
      const chartName = params.chartName;

      if (chartName) {
        this.chartsService.getChart(repo, chartName).pipe(
          take(1),
          switchMap(chart => {
            clearTimeout(this.loadingDelay);
            this.chart = chart;
            this.chartSubTitle = chart.attributes.repo.name;
            if (getMonocularEndpoint(this.route, chart) !== stratosMonocularEndpointGuid) {
              this.chartSubTitle = 'Artifact Hub - ' + this.chartSubTitle;
            }
            const version = params.version || this.chart.relationships.latestChartVersion.data.version;
            return this.chartsService.getVersion(repo, chartName, version).pipe(take(1));
          }),
          tap(chartVersion => {
            this.currentVersion = chartVersion;
            this.titleVersion = this.currentVersion.attributes.app_version || '';
            this.updateMetaTags();
            this.iconUrl = this.chartsService.getChartIconURL(this.chart, chartVersion);
          }),
          finalize(() => {
            clearTimeout(this.loadingDelay);
            this.loading = false;
            this.initing = false;
            this.cdr.markForCheck();
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
    return `/charts/${getMonocularEndpoint(null, this.chart)}/${this.chart.attributes.repo.name}`;
  }
}
