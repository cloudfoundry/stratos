import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseChartDirective } from 'ng2-charts';

import type { UsagePoint } from '../../../features/applications/app-detail-data.service';
import { InstanceUsageChartComponent, formatBytes } from './instance-usage-chart.component';

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

  it('humanizes byte ticks for the mem metric', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    const callback = (component.options()!.scales!.y as any).ticks.callback;
    expect(callback(256 * 1024 * 1024)).toBe('256 MB');
    expect(callback(0)).toBe('0');
  });

  it('humanizes byte ticks for the disk metric', () => {
    fixture.componentRef.setInput('metric', 'disk');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    const callback = (component.options()!.scales!.y as any).ticks.callback;
    expect(callback(1024 ** 3)).toBe('1 GB');
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

describe('formatBytes', () => {
  it('renders 0 as a bare "0"', () => {
    expect(formatBytes(0)).toBe('0');
  });

  it('picks the right 1024-based unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(256 * 1024 * 1024)).toBe('256 MB');
    expect(formatBytes(512 * 1024 * 1024)).toBe('512 MB');
    expect(formatBytes(1024 ** 3)).toBe('1 GB');
  });

  it('keeps at most one decimal place', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1.5 * 1024 ** 3)).toBe('1.5 GB');
  });

  it('promotes to the next unit when rounding hits the boundary', () => {
    // 1048575 -> 1023.999... KB which rounds to 1024 KB -> promote to 1 MB.
    expect(formatBytes(1048575)).toBe('1 MB');
    // 1073741823 -> 1023.999... MB which rounds to 1024 MB -> promote to 1 GB.
    expect(formatBytes(1073741823)).toBe('1 GB');
  });

  it('treats NaN and non-finite values as 0', () => {
    expect(formatBytes(NaN)).toBe('0');
    expect(formatBytes(Infinity)).toBe('0');
  });

  it('handles negative values by magnitude', () => {
    expect(formatBytes(-256 * 1024 * 1024)).toBe('-256 MB');
  });
});
