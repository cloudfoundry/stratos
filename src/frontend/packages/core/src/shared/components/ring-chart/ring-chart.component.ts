import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';

import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-ring-chart',
  templateUrl: './ring-chart.component.html',
  styleUrls: ['./ring-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    BaseChartDirective
]
})
export class RingChartComponent implements OnInit, OnChanges {

  domain: any[];
  chartJsData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  @Input() data: any[];
  @Input() label = 'Total';
  @Input() scheme: any = 'cool';
  @Input() customColors: any[];

  @Input() onClick: ($event: Event) => void = () => { };
  @Input() onActivate: ($event: Event) => void = () => { };
  @Input() onDeactivate: ($event: Event) => void = () => { };
  @Input() valueFormatting: (value: number) => any = value => value;
  @Input() nameFormatting: (value: string) => any = label => label;
  @Input() percentageFormatting: (value: number) => any = percentage => percentage;

  ngOnInit() {
    if (!this.data) {
      this.data = [];
    }
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    this.domain = this.getDomain();
    this.updateChartData();
  }

  updateChartData(): void {
    if (!this.data) {
      return;
    }

    this.chartJsData = {
      labels: this.data.map(d => d.name),
      datasets: [{
        data: this.data.map(d => d.value),
        backgroundColor: this.getBackgroundColors()
      }]
    };
  }

  getBackgroundColors(): string[] {
    if (this.customColors && this.customColors.length > 0) {
      return this.customColors.map(c => c.value || c);
    }
    // Default color scheme
    const defaultColors = ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'];
    return this.data.map((_, i) => defaultColors[i % defaultColors.length]);
  }

  getItemColor(index: number): string {
    const colors = this.getBackgroundColors();
    return colors[index] || '#AAAAAA';
  }

  getDomain(): any[] {
    return this.data.map(d => d.name);
  }

  getTotal(): number {
    return this.data
      .map(d => d.value)
      .reduce((sum, d) => sum + d, 0);
  }

}
