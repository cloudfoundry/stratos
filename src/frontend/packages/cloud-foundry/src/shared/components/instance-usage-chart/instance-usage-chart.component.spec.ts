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

  // Build a minimal fake chart.js instance for exercising the legend onClick.
  // The onClick reads instanceIndex off the clicked dataset and flips the
  // chart's internal hidden set, so the fake only needs the datasets array.
  const makeFakeChart = (instanceIndices: number[]) => ({
    data: { datasets: instanceIndices.map(i => ({ instanceIndex: i })) },
  });

  it('onClick toggles the internal hidden set, driving chartData and the plugin', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
      [2, [{ t: 1, cpu: 0, mem: 20, disk: 0 }]],
    ]));
    fixture.detectChanges();

    // Initially every line is visible.
    expect(component.chartData().datasets.map(d => (d as any).hidden)).toEqual([false, false, false]);

    // Click the legend for instance 1.
    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([0, 1, 2]) });

    // chartData() reflects the internal set: instance 1 is now hidden.
    let ds = component.chartData().datasets;
    expect((ds[0] as any).hidden).toBe(false);
    expect((ds[1] as any).hidden).toBe(true);
    expect((ds[2] as any).hidden).toBe(false);

    // The plugin enforces the same selection onto chart meta.
    const enforce = makeFakeChartWithMeta([0, 1, 2]);
    (component as any).visibilityPlugin.afterUpdate(enforce.chart);
    expect(enforce.metas[1].hidden).toBe(true);

    // Toggling again clears instance 1.
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([0, 1, 2]) });
    ds = component.chartData().datasets;
    expect((ds[1] as any).hidden).toBe(false);
  });

  it('persists a hidden instance across a history change (poll) (regression)', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
      [2, [{ t: 1, cpu: 0, mem: 20, disk: 0 }]],
    ]));
    fixture.detectChanges();

    // Hide instance 1 via a legend click.
    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([0, 1, 2]) });
    expect((component.chartData().datasets[1] as any).hidden).toBe(true);

    // Simulate a live poll delivering a fresh history Map. The internal hidden
    // set is unchanged, so the selection must survive.
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }, { t: 2, cpu: 0, mem: 105, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }, { t: 2, cpu: 0, mem: 55, disk: 0 }]],
      [2, [{ t: 1, cpu: 0, mem: 20, disk: 0 }, { t: 2, cpu: 0, mem: 25, disk: 0 }]],
    ]));

    const ds = component.chartData().datasets;
    expect((ds[0] as any).hidden).toBe(false);
    expect((ds[1] as any).hidden).toBe(true);
    expect((ds[2] as any).hidden).toBe(false);
  });

  // The headless harness can't render chart.js, so exercise the visibility
  // plugin's afterUpdate directly with a fake chart. instanceIndex drives the
  // mapping; getDatasetMeta returns a stable per-index meta object.
  const makeFakeChartWithMeta = (instanceIndices: number[]) => {
    const metas: Array<{ hidden?: boolean }> = [];
    return {
      chart: {
        data: { datasets: instanceIndices.map(i => ({ instanceIndex: i })) },
        getDatasetMeta: (i: number) => (metas[i] ??= {}),
      },
      metas,
    };
  };

  it('plugin hides exactly the instances in the internal hidden set', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    // Hide instance 1 via a legend click on the internal set.
    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([0, 1, 2]) });

    const { chart, metas } = makeFakeChartWithMeta([0, 1, 2]);
    (component as any).visibilityPlugin.afterUpdate(chart);

    // The plugin only writes meta.hidden when it must change; an already-visible
    // meta stays untouched (undefined). Assert on truthiness, not strict false.
    expect(!!metas[0].hidden).toBe(false);
    expect(metas[1].hidden).toBe(true);
    expect(!!metas[2].hidden).toBe(false);
  });

  it('plugin shows everything when the hidden set is empty (toggle off)', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();

    const { chart, metas } = makeFakeChartWithMeta([0, 1, 2]);
    // Pre-hide everything so the empty set forces the plugin to un-hide.
    metas[0] = { hidden: true };
    metas[1] = { hidden: true };
    metas[2] = { hidden: true };
    (component as any).visibilityPlugin.afterUpdate(chart);

    expect(metas[0].hidden).toBe(false);
    expect(metas[1].hidden).toBe(false);
    expect(metas[2].hidden).toBe(false);
  });

  it('plugin maps by instanceIndex, not dataset position', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>());
    fixture.detectChanges();
    // Hide instance 0 via a legend click on the internal set.
    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 0 }, { chart: makeFakeChart([0]) });

    // Datasets in non-identity order: positions [0,1,2] -> instanceIndex [2,0,1].
    const { chart, metas } = makeFakeChartWithMeta([2, 0, 1]);
    (component as any).visibilityPlugin.afterUpdate(chart);

    // Instance 0 lives at position 1 — that meta must be the hidden one.
    expect(!!metas[0].hidden).toBe(false);
    expect(metas[1].hidden).toBe(true);
    expect(!!metas[2].hidden).toBe(false);
  });

  it('maps datasetIndex back to instanceIndex when datasets are sorted', () => {
    // datasets are sorted by instance index, so datasetIndex === position, but
    // the onClick must read instanceIndex off the dataset, not assume identity.
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [2, [{ t: 1, cpu: 0, mem: 30, disk: 0 }]],
      [5, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
    ]));
    fixture.detectChanges();

    // datasets sorted -> [instance 2, instance 5]. Click datasetIndex 1 (instance 5).
    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([2, 5]) });

    // Instance 5 (not its position) is the one hidden in chartData().
    const ds = component.chartData().datasets;
    expect((ds[0] as any).hidden).toBe(false); // instance 2
    expect((ds[1] as any).hidden).toBe(true);  // instance 5
  });

  it('linkedHidden (non-null) shadows the internal set in chartData and the plugin', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
      [2, [{ t: 1, cpu: 0, mem: 20, disk: 0 }]],
    ]));
    fixture.detectChanges();

    // Internal per-metric set hides instance 0 …
    component.hiddenInstances.set(new Set([0]));
    // … but the linked overlay hides instance 1 instead. The overlay wins.
    // Set the signal input directly (no detectChanges → no real chart render in
    // this headless harness; chartData()/plugin read the signals synchronously).
    fixture.componentRef.setInput('linkedHidden', new Set([1]));

    const ds = component.chartData().datasets;
    expect((ds[1] as any).hidden).toBe(true);    // shown per the linked set
    expect((ds[0] as any).hidden).toBeFalsy();   // internal 0 is shadowed away

    // The plugin enforces the linked set, not the internal one.
    const { chart, metas } = makeFakeChartWithMeta([0, 1, 2]);
    (component as any).visibilityPlugin.afterUpdate(chart);
    expect(!!metas[0].hidden).toBe(false);
    expect(metas[1].hidden).toBe(true);
    expect(!!metas[2].hidden).toBe(false);
  });

  it('onClick while linked emits toggleLinked and leaves the internal set untouched', () => {
    fixture.componentRef.setInput('metric', 'mem');
    fixture.componentRef.setInput('history', new Map<number, UsagePoint[]>([
      [0, [{ t: 1, cpu: 0, mem: 100, disk: 0 }]],
      [1, [{ t: 1, cpu: 0, mem: 50, disk: 0 }]],
    ]));
    fixture.componentRef.setInput('linkedHidden', new Set<number>());
    fixture.detectChanges();

    const before = component.hiddenInstances();
    const emitted: number[] = [];
    component.toggleLinked.subscribe(i => emitted.push(i));

    const onClick = (component.options() as any).plugins.legend.onClick;
    onClick({}, { datasetIndex: 1 }, { chart: makeFakeChart([0, 1]) });

    expect(emitted).toEqual([1]);
    // Internal per-metric set unchanged (the parent owns the shared set).
    expect(component.hiddenInstances()).toBe(before);
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
