
import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Chart } from '../shared/models/chart';
import { ChartsService } from '../shared/services/charts.service';
import { ListItemComponent } from '../list-item/list-item.component';

@Component({
  selector: 'app-chart-item',
  templateUrl: './chart-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, ListItemComponent]
})
export class ChartItemComponent implements OnInit {
  public iconUrl!: string;
  // Chart to represent
  @Input() chart!: Chart;
  // Show version form by default
  @Input() showVersion = true;
  // Truncate the description
  @Input() showDescription = true;

  @Input() artifactHubAndHelmRepoTypes$!: Observable<boolean>; // strict: required @Input, always bound by the parent template

  private chartsService = inject(ChartsService);

  ngOnInit() {
    this.iconUrl = this.chartsService.getChartIconURL(this.chart);
  }

  goToDetailUrl(): string {
    return this.chartsService.getChartSummaryRoute(this.chart.attributes.repo.name, this.chart.attributes.name, undefined, undefined, this.chart);
  }

}
