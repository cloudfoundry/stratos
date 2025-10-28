import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { Chart } from '../shared/models/chart';
import { ChartsService } from '../shared/services/charts.service';

@Component({
  selector: 'app-chart-item',
  templateUrl: './chart-item.component.html',
  styleUrls: ['./chart-item.component.scss'],
  standalone: true
})
export class ChartItemComponent implements OnInit {
  public iconUrl: string;
  // Chart to represent
  @Input() chart: Chart;
  // Show version form by default
  @Input() showVersion = true;
  // Truncate the description
  @Input() showDescription = true;

  @Input() artifactHubAndHelmRepoTypes$: Observable<boolean>;

  constructor(private chartsService: ChartsService) {
  }

  ngOnInit() {
    this.iconUrl = this.chartsService.getChartIconURL(this.chart);
  }

  goToDetailUrl(): string {
    return this.chartsService.getChartSummaryRoute(this.chart.attributes.repo.name, this.chart.attributes.name, null, null, this.chart);
  }

}
