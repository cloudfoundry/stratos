import { ChangeDetectionStrategy, Component, Input, type OnChanges, type OnInit, ViewEncapsulation  } from '@angular/core';

import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

export interface RingChartDataItem {
  name: string;
  value: number;
}

@Component({
  selector: 'app-ring-chart',
  templateUrl: './ring-chart.component.html',
  styleUrls: ['./ring-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    BaseChartDirective
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RingChartComponent implements OnInit, OnChanges {

  domain: string[] = [];
  chartJsData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  @Input() data: RingChartDataItem[] = [];
  @Input() label = 'Total';
  @Input() scheme: unknown = 'cool';
  @Input() customColors: unknown[] = [];

  @Input() onClick: ($event: Event) => void = () => {
    // Event handler - override in parent
  };
  @Input() onActivate: ($event: Event) => void = () => {
    // Event handler - override in parent
  };
  @Input() onDeactivate: ($event: Event) => void = () => {
    // Event handler - override in parent
  };
  @Input() valueFormatting: (value: number) => string | number = value => value;
  @Input() nameFormatting: (value: string) => string = label => label;
  @Input() percentageFormatting: (value: number) => string | number = percentage => percentage;

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
      return this.customColors.map((c: any) => c.value || c);
    }
    // Default color scheme
    const defaultColors = ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'];
    return this.data.map((_, i) => defaultColors[i % defaultColors.length]);
  }

  getItemColor(index: number): string {
    const colors = this.getBackgroundColors();
    return colors[index] || '#AAAAAA';
  }

  getDomain(): string[] {
    return this.data.map(d => d.name);
  }

  getTotal(): number {
    return this.data
      .map(d => d.value)
      .reduce((sum, d) => sum + d, 0);
  }

}
