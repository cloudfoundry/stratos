import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppAutoscalerComboChartComponent } from './combo-chart.component';

describe('AppAutoscalerComboChartComponent', () => {
  let component: AppAutoscalerComboChartComponent;

  beforeEach(() => {
    // Only the data and options built for chart.js are under test; drop the
    // canvas so the chart itself is not drawn.
    TestBed.configureTestingModule({
      imports: [AppAutoscalerComboChartComponent],
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.overrideComponent(AppAutoscalerComboChartComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(AppAutoscalerComboChartComponent).componentInstance;
  });

  const results = [
    { name: '10:00', value: '12.5' },
    { name: '10:01', value: 40 },
    { name: '10:02', value: '0' },
  ];

  it('starts with no data', () => {
    expect(component.comboChartData).toEqual({ labels: [], datasets: [] });
  });

  // One bar per time bucket: the metric arrives as strings or numbers and
  // chart.js needs numbers.
  it('builds one bar dataset from the results', () => {
    component.metricName = 'memoryused';
    component.results = results;
    component.ngOnChanges();

    const [bars, ...rest] = component.comboChartData.datasets;
    expect(rest).toHaveLength(0);
    expect(bars).toMatchObject({ type: 'bar', label: 'memoryused', data: [12.5, 40, 0], yAxisID: 'y' });
    expect(component.comboChartData.labels).toEqual(['10:00', '10:01', '10:02']);
  });

  // A bar is coloured by the trigger state of its bucket; buckets with no
  // custom colour use the first colour of the scheme.
  it('colours each bar from customColors, falling back to the scheme', () => {
    component.results = results;
    component.customColors = [
      { name: '10:00', value: 'rgba(255, 0, 0, 0.6)' },
      { name: '10:02', value: 'rgba(51, 204, 255, 0.6)' },
    ];
    component.scheme = { domain: ['#123456', '#abcdef'] };
    component.ngOnChanges();

    expect(component.comboChartData.datasets[0].backgroundColor).toEqual([
      'rgba(255, 0, 0, 0.6)',
      '#123456',
      'rgba(51, 204, 255, 0.6)',
    ]);
  });

  it('uses a fixed bar colour when there is no scheme', () => {
    component.results = results.slice(0, 1);
    component.ngOnChanges();

    expect(component.comboChartData.datasets[0].backgroundColor).toEqual(['#01579b']);
  });

  // Threshold lines share the bars' unit, so they must share the 'y' axis
  // or a threshold would be drawn against a different scale.
  it('adds one line dataset per threshold series on the bar axis', () => {
    component.results = results;
    component.lineChart = [
      { name: 'memoryused > 80', series: [{ name: '10:00', value: '80' }, { name: '10:02', value: 80 }] },
      { name: 'memoryused < 20', series: [{ name: '10:00', value: 20 }, { name: '10:02', value: '20' }] },
    ];
    component.customColors = [{ name: 'memoryused > 80', value: 'rgba(255, 0, 0, 0.6)' }];
    component.colorSchemeLine = { domain: ['#aaaaaa', '#bbbbbb'] };
    component.ngOnChanges();

    const lines = component.comboChartData.datasets.slice(1);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      type: 'line',
      label: 'memoryused > 80',
      data: [80, 80],
      borderColor: 'rgba(255, 0, 0, 0.6)',
      yAxisID: 'y',
    });
    // No custom colour: the line takes the scheme colour at its position.
    expect(lines[1]).toMatchObject({
      type: 'line',
      label: 'memoryused < 20',
      data: [20, 20],
      borderColor: '#bbbbbb',
      yAxisID: 'y',
    });
  });

  // A threshold near the top of the range must stay visible even when the
  // metric values are all low.
  it('extends the y axis to yScaleMax', () => {
    component.yScaleMax = 100;
    component.yAxis = true;
    component.ngOnChanges();

    const y = component.comboChartOptions!.scales!['y']!;
    expect(y).toMatchObject({ suggestedMax: 100, display: true, beginAtZero: true });
  });

  it('rebuilds the data when the inputs change', () => {
    component.results = results;
    component.ngOnChanges();
    component.results = results.slice(0, 1);
    component.lineChart = [];
    component.ngOnChanges();

    expect(component.comboChartData.labels).toEqual(['10:00']);
    expect(component.comboChartData.datasets).toHaveLength(1);
  });

  // The legend lists the threshold ranges, not the datasets.
  it('shows the legend entries from legendData', () => {
    component.legend = true;
    component.legendData = [{ name: 'memoryused > 80', value: 'rgba(255, 0, 0, 0.6)' }];
    component.ngOnChanges();

    const legend = component.comboChartOptions!.plugins!.legend!;
    expect(legend.display).toBe(true);
    const labels = legend.labels!.generateLabels!(null as never);
    expect(labels).toEqual([
      { text: 'memoryused > 80', fillStyle: 'rgba(255, 0, 0, 0.6)', strokeStyle: 'rgba(255, 0, 0, 0.6)', lineWidth: 0 },
    ]);
  });
});
