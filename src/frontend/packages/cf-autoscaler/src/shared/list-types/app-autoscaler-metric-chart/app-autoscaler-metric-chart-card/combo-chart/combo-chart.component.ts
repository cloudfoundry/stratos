import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  OnChanges,
} from '@angular/core';
import { ChartConfiguration, ChartEvent, ActiveElement } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-autoscaler-combo-chart-component',
  templateUrl: './combo-chart.component.html',
  styleUrls: ['./combo-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    BaseChartDirective,
  ]
})
export class AppAutoscalerComboChartComponent implements OnChanges {

  @Input() width = 400;
  @Input() height = 300;
  @Input() legend = false;
  @Input() xAxisLabel: string;
  @Input() yAxisLabel: string;
  @Input() results: any[] = [];
  @Input() lineChart: any[] = [];
  @Input() colorSchemeLine: any;
  @Input() scheme: any;

  @Output() select = new EventEmitter();
  @Output() activate = new EventEmitter();
  @Output() deactivate = new EventEmitter();

  public comboChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public comboChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: ''
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: ''
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };

  ngOnChanges() {
    this.updateChartData();
  }

  private updateChartData() {
    if (!this.results && !this.lineChart) {
      this.comboChartData = { labels: [], datasets: [] };
      return;
    }

    // Get labels from the data
    const labels = this.results && this.results.length > 0
      ? this.results[0].series.map(item => new Date(item.name).toLocaleDateString())
      : [];

    const datasets: any[] = [];

    // Add bar datasets
    if (this.results) {
      this.results.forEach((series, index) => {
        datasets.push({
          type: 'bar',
          label: series.name,
          data: series.series.map(item => item.value),
          backgroundColor: this.getColor(index, 'bar'),
          yAxisID: 'y'
        });
      });
    }

    // Add line datasets
    if (this.lineChart) {
      this.lineChart.forEach((series, index) => {
        datasets.push({
          type: 'line',
          label: series.name,
          data: series.series.map(item => item.value),
          borderColor: this.getColor(index, 'line'),
          backgroundColor: this.getColor(index, 'line') + '20',
          fill: false,
          tension: 0.1,
          yAxisID: 'y1'
        });
      });
    }

    this.comboChartData = { labels, datasets };

    // Update axis labels
    if (this.comboChartOptions?.scales?.x && 'title' in this.comboChartOptions.scales.x && this.comboChartOptions.scales.x.title) {
      this.comboChartOptions.scales.x.title.text = this.xAxisLabel || '';
    }
    if (this.comboChartOptions?.scales?.y && 'title' in this.comboChartOptions.scales.y && this.comboChartOptions.scales.y.title) {
      this.comboChartOptions.scales.y.title.text = this.yAxisLabel || '';
    }
  }

  private getColor(index: number, type: 'bar' | 'line'): string {
    const barColors = ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'];
    const lineColors = ['#FF7F0E', '#2CA02C', '#D62728', '#9467BD'];

    const colors = type === 'bar' ? barColors : lineColors;
    return colors[index % colors.length];
  }

  onChartClick(event: ChartEvent, active: ActiveElement[]) {
    this.select.emit({ event, active });
  }

  onChartHover(event: ChartEvent, active: ActiveElement[]) {
    this.activate.emit({ event, active });
  }
}