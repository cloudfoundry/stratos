import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { Chart } from '../shared/models/chart';
import { ChartsService } from '../shared/services/charts.service';

@Component({
  selector: 'app-chart-item',
  templateUrl: './chart-item.component.html',
  styleUrls: ['./chart-item.component.scss'],
  /* tslint:disable-next-line:no-inputs-metadata-property */
  inputs: ['chart', 'showVersion', 'showDescription', 'artifactHubAndOthers$']
})
export class ChartItemComponent implements OnInit {
  public iconUrl: string;
  // Chart to represent
  public chart: Chart;
  // Show version form by default
  public showVersion = true;
  // Truncate the description
  public showDescription = true;

  public artifactHubAndOthers$: Observable<boolean>;
  public endpointName$: Observable<string>;

  constructor(private chartsService: ChartsService) {
  }

  ngOnInit() {
    this.iconUrl = this.chartsService.getChartIconURL(this.chart);
    this.endpointName$ = this.artifactHubAndOthers$.pipe(
      switchMap(artifactHubAndOthers => {
        // Only show if we have artifact hub registered and there's other helm repo's also registered
        if (!artifactHubAndOthers) {
          return of(null);
        }
        if (!this.chart.monocularEndpointId) {
          return of('Stratos');
        } else {
          return stratosEntityCatalog.endpoint.store.getEntityMonitor(this.chart.monocularEndpointId).entity$.pipe(
            map(endpoint => endpoint.name)
          );
        }
      }),
    );
  }

  goToDetailUrl(): string {
    return this.chartsService.getChartSummaryRoute(this.chart.attributes.repo.name, this.chart.attributes.name, null, null, this.chart);
  }

}
