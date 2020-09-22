import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { first } from 'rxjs/operators';

import { Chart } from '../shared/models/chart';
import { ChartVersion } from '../shared/models/chart-version';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { getMonocularEndpoint, stratosMonocularEndpointGuid } from '../stratos-monocular.helper';

@Component({
  selector: 'app-chart-details',
  templateUrl: './chart-details.component.html',
  styleUrls: ['./chart-details.component.scss']
})
export class ChartDetailsComponent implements OnInit {
  /* This resource will be different, probably ChartVersion */
  chart: Chart;
  loading = false;
  initing = true;
  currentVersion: ChartVersion;
  iconUrl: string;
  titleVersion: string;
  chartSubTitle: string;

  loadingDelay: any;

  constructor(
    private route: ActivatedRoute,
    private chartsService: ChartsService,
    private config: ConfigService,
  ) {
    this.loadingDelay = setTimeout(() => this.loading = true, 100);
  }

  ngOnInit() {
    this.route.params.forEach((params: Params) => {
      const repo = params.repo;
      const chartName = params.chartName;

      if (!!chartName) {
        this.chartsService.getChart(repo, chartName).pipe(first()).subscribe(chart => {
          clearTimeout(this.loadingDelay);
          this.loading = false;
          this.initing = false;
          this.chart = chart;
          this.chartSubTitle = chart.attributes.repo.name;
          if (getMonocularEndpoint(this.route, chart) !== stratosMonocularEndpointGuid) {
            this.chartSubTitle = 'Helm Hub - ' + this.chartSubTitle;
          }
          const version = params.version || this.chart.relationships.latestChartVersion.data.version;
          this.chartsService.getVersion(repo, chartName, version).pipe(first())
            .subscribe(chartVersion => {
              this.currentVersion = chartVersion;
              this.titleVersion = this.currentVersion.attributes.app_version || '';
              this.updateMetaTags();
              this.iconUrl = this.chartsService.getChartIconURL(this.chart, chartVersion);
            });
        });
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
