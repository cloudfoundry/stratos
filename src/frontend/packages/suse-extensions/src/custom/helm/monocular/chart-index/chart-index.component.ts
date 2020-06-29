import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { Chart } from '../shared/models/chart';
import { ChartsService } from '../shared/services/charts.service';

@Component({
  selector: 'app-chart-index',
  templateUrl: './chart-index.component.html',
  styleUrls: ['./chart-index.component.scss']
})
export class ChartIndexComponent implements OnInit {
  charts: Chart[];
  loading = true;
  totalChartsNumber: number;

  constructor(
    private chartsService: ChartsService,
  ) { }

  ngOnInit() {
    this.loadCharts();
  }

  loadCharts(): void {
    this.chartsService.getCharts().pipe(first()).subscribe(charts => {
      this.loading = false;
      this.charts = charts || [];
      this.totalChartsNumber = charts.length;
    });
  }
}
