import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseChartDirective } from 'ng2-charts';

import type { UsagePoint } from '../../../features/applications/app-detail-data.service';
import { InstanceUsageChartComponent } from './instance-usage-chart.component';

describe('InstanceUsageChartComponent', () => {
  let component: InstanceUsageChartComponent;
  let fixture: ComponentFixture<InstanceUsageChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        NoopAnimationsModule,
        BaseChartDirective,
        InstanceUsageChartComponent,
      ],
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstanceUsageChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('builds one dataset per instance for the chosen metric', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }, { t: 2, cpu: 0, mem: 110, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
    ]));
    fixture.detectChanges();
    expect(component.chartData().datasets.length).toBe(2);
    expect(component.chartData().datasets[0].data).toEqual([100, 110]);
    expect(component.chartData().datasets[1].data).toEqual([50]);
  });

  it('selecting cpu pulls the cpu field', () => {
    fixture.componentRef.setInput('metric', 'cpu');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0.25, mem: 100, disk: 0 }, { t: 2, cpu: 0.5, mem: 110, disk: 0 }]],
    ]));
    fixture.detectChanges();
    expect(component.chartData().datasets.length).toBe(1);
    expect(component.chartData().datasets[0].data).toEqual([0.25, 0.5]);
  });

  it('sorts datasets by instance index', () => {
    fixture.componentRef.setInput('metric', 'disk');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [2, [{ t: 1, cpu: 0, mem: 0, disk: 30 }]],
      [0, [{ t: 1, cpu: 0, mem: 0, disk: 10 }]],
      [1, [{ t: 1, cpu: 0, mem: 0, disk: 20 }]],
    ]));
    fixture.detectChanges();
    expect(component.chartData().datasets.map(d => d.label))
      .toEqual(['Instance 0', 'Instance 1', 'Instance 2']);
    expect(component.chartData().datasets.map(d => d.data)).toEqual([[10], [20], [30]]);
  });

  it('empty history produces no datasets and does not crash', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    expect(component.chartData().datasets.length).toBe(0);
    expect(component.chartData().labels).toEqual([]);
  });

  it('formats the cpu y-axis ticks as percentages', () => {
    fixture.componentRef.setInput('metric', 'cpu');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    const callback = (component.options()!.scales!.y as any).ticks.callback;
    expect(callback(0.25)).toBe('25%');
    expect(callback(0.5)).toBe('50%');
  });

  it('leaves the y-axis ticks unformatted for non-cpu metrics', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    expect((component.options()!.scales!.y as any).ticks?.callback).toBeUndefined();
  });

  it('toggles the y-axis title from the unitLabel input', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.componentRef.setInput('unitLabel', 'MB');
    fixture.detectChanges();
    let title = (component.options()!.scales!.y as any).title;
    expect(title.display).toBe(true);
    expect(title.text).toBe('MB');

    fixture.componentRef.setInput('unitLabel', '');
    title = (component.options()!.scales!.y as any).title;
    expect(title.display).toBe(false);
  });
});
