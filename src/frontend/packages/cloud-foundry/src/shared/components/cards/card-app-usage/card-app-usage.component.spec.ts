import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';

import { CardAppUsageComponent } from './card-app-usage.component';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';

interface InstanceShape {
  state: string;
  memQuota?: number;
  diskQuota?: number;
  /** Per-instance usage fractions (0..1) for cpu, plus absolute mem/disk in bytes. */
  usage?: { cpu: number; mem: number; disk: number };
}

/** Build an StAppStat row inline — only the fields the card aggregates. */
function inst(state: string, opts: Partial<InstanceShape> = {}): any {
  return {
    index: 0,
    state,
    uptime: 0,
    memQuota: opts.memQuota ?? 0,
    diskQuota: opts.diskQuota ?? 0,
    fdsQuota: 0,
    usage: opts.usage,
  };
}

/** Minimal AppDetailDataService stub matching the contract the card reads. */
function makeDataStub(opts: {
  running?: boolean;
  stats?: any[];
} = {}) {
  const runningSig: WritableSignal<boolean> = signal(opts.running ?? true);
  const statsSig: WritableSignal<any[]> = signal(opts.stats ?? []);
  return {
    running: computed(() => runningSig()),
    stats: statsSig.asReadonly(),
    // Expose the writable refs so individual tests can mutate.
    _runningSig: runningSig,
    _statsSig: statsSig,
  };
}

function setup(opts: { running?: boolean; stats?: any[] } = {}) {
  const dataStub = makeDataStub(opts);
  TestBed.configureTestingModule({
    imports: [CardAppUsageComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AppDetailDataService, useValue: dataStub },
    ],
  });
  const fixture: ComponentFixture<CardAppUsageComponent> = TestBed.createComponent(CardAppUsageComponent);
  fixture.detectChanges();
  return { fixture, dataStub };
}

describe('CardAppUsageComponent', () => {
  it('creates', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('when app is not running', () => {
    it('shows the not-running card content', () => {
      const { fixture } = setup({ running: false });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('Application is not running');
    });

    it('does not render the usage table', () => {
      const { fixture } = setup({ running: false });
      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeNull();
    });
  });

  describe('when stats are empty', () => {
    it('renders no usage table (no usage data yet)', () => {
      const { fixture } = setup({ running: true, stats: [] });
      expect(fixture.componentInstance.hasUsageData()).toBe(false);
      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeNull();
    });

    it('reports zeros for max and avg', () => {
      const { fixture } = setup({ running: true, stats: [] });
      const c = fixture.componentInstance;
      expect(c.max()).toEqual({ mem: 0, disk: 0, cpu: 0 });
      expect(c.avg()).toEqual({ mem: 0, disk: 0, cpu: 0 });
    });
  });

  describe('aggregation across running instances', () => {
    it('computes 50% CPU max + avg from two running instances at 0.5 each', () => {
      const stats = [
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.5, mem: 50, disk: 50 } }),
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.5, mem: 50, disk: 50 } }),
      ];
      const { fixture } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.max().cpu).toBe(0.5);
      expect(c.avg().cpu).toBe(0.5);
      expect(c.max().mem).toBe(0.5);
      expect(c.avg().mem).toBe(0.5);
      expect(c.max().disk).toBe(0.5);
      expect(c.avg().disk).toBe(0.5);
    });

    it('takes max as the worst running instance, avg as the mean', () => {
      const stats = [
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.2, mem: 20, disk: 30 } }),
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.8, mem: 80, disk: 60 } }),
      ];
      const { fixture } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.max().cpu).toBe(0.8);
      expect(c.max().mem).toBe(0.8);
      expect(c.max().disk).toBe(0.6);
      expect(c.avg().cpu).toBe(0.5);
      expect(c.avg().mem).toBe(0.5);
      expect(c.avg().disk).toBeCloseTo(0.45, 4);
    });

    it('excludes non-RUNNING instances from aggregation', () => {
      const stats = [
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.4, mem: 40, disk: 40 } }),
        inst('CRASHED', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.99, mem: 99, disk: 99 } }),
      ];
      const { fixture } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.max().cpu).toBe(0.4);
      expect(c.avg().cpu).toBe(0.4);
    });

    it('skips RUNNING instances that lack a usage payload', () => {
      const stats = [
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.3, mem: 30, disk: 30 } }),
        inst('RUNNING', { memQuota: 100, diskQuota: 100 }), // no usage yet
      ];
      const { fixture } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.avg().cpu).toBe(0.3);
      expect(c.max().cpu).toBe(0.3);
    });

    it('handles a zero quota by treating the fraction as 0 (no NaN/Infinity leak)', () => {
      const stats = [
        inst('RUNNING', { memQuota: 0, diskQuota: 0, usage: { cpu: 0.1, mem: 5, disk: 5 } }),
      ];
      const { fixture } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.max().mem).toBe(0);
      expect(c.max().disk).toBe(0);
      expect(c.avg().mem).toBe(0);
      expect(c.avg().disk).toBe(0);
      expect(c.max().cpu).toBe(0.1);
    });
  });

  describe('threshold statuses', () => {
    it('reports ok when usage is below 80%', () => {
      const stats = [inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.1, mem: 10, disk: 10 } })];
      const { fixture } = setup({ running: true, stats });
      const s = fixture.componentInstance.statuses();
      expect(s.mem).toBe('ok');
      expect(s.disk).toBe('ok');
      expect(s.cpu).toBe('ok');
    });

    it('reports warning at >=80% and <90%', () => {
      const stats = [inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.85, mem: 85, disk: 85 } })];
      const { fixture } = setup({ running: true, stats });
      const s = fixture.componentInstance.statuses();
      expect(s.mem).toBe('warning');
      expect(s.disk).toBe('warning');
      expect(s.cpu).toBe('warning');
    });

    it('reports error at >=90%', () => {
      const stats = [inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.95, mem: 95, disk: 95 } })];
      const { fixture } = setup({ running: true, stats });
      const s = fixture.componentInstance.statuses();
      expect(s.mem).toBe('error');
      expect(s.disk).toBe('error');
      expect(s.cpu).toBe('error');
    });
  });

  describe('reactivity', () => {
    it('recomputes when stats() updates', () => {
      const initial = [inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.1, mem: 10, disk: 10 } })];
      const { fixture, dataStub } = setup({ running: true, stats: initial });
      const c = fixture.componentInstance;
      expect(c.max().cpu).toBe(0.1);

      dataStub._statsSig.set([
        inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.95, mem: 95, disk: 95 } }),
      ]);
      fixture.detectChanges();
      expect(c.max().cpu).toBe(0.95);
      expect(c.statuses().cpu).toBe('error');
    });

    it('recomputes when running() flips false', () => {
      const stats = [inst('RUNNING', { memQuota: 100, diskQuota: 100, usage: { cpu: 0.1, mem: 10, disk: 10 } })];
      const { fixture, dataStub } = setup({ running: true, stats });
      const c = fixture.componentInstance;
      expect(c.isRunning()).toBe(true);

      dataStub._runningSig.set(false);
      fixture.detectChanges();
      expect(c.isRunning()).toBe(false);
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('Application is not running');
    });
  });
});
