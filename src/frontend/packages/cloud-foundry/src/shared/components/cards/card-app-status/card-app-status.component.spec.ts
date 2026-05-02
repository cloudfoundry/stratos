import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CardAppStatusComponent } from './card-app-status.component';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { AppApplicationActionsService } from '../../../services/application-actions.service';

/** Minimal AppDetailDataService stub */
function makeDataStub(overrides: Partial<{
  state: string;
  memoryMb: number;
  diskMb: number;
  statsRunning: number;
  statsTotal: number;
  lastPolledAt: Date | null;
}> = {}) {
  const state = overrides.state ?? 'STARTED';
  const memoryMb = overrides.memoryMb ?? 256;
  const diskMb = overrides.diskMb ?? 1024;
  const runningCount = overrides.statsRunning ?? 2;
  const totalCount = overrides.statsTotal ?? 2;
  const lastPoll = overrides.lastPolledAt ?? null;

  const stats = Array.from({ length: totalCount }, (_, i) => ({
    state: i < runningCount ? 'RUNNING' : 'CRASHED',
    cfGuid: 'cf',
    guid: `inst-${i}`,
    stats: {} as any,
  }));

  return {
    app: signal<any>({ entity: { state } }).asReadonly(),
    summary: signal<any>({ memory: memoryMb, disk_quota: diskMb }).asReadonly(),
    stats: signal<any[]>(stats).asReadonly(),
    state: computed(() => ({ label: state, indicator: null, actions: {} })),
    lastPolledAt: signal<Date | null>(lastPoll).asReadonly(),
  };
}

/** Minimal AppApplicationActionsService stub */
function makeActionsStub(overrides: Partial<{
  inFlight: boolean;
  verb: string | null;
  progress: any[] | null;
}> = {}) {
  return {
    inFlight: signal(overrides.inFlight ?? false).asReadonly(),
    verb: signal<any>(overrides.verb ?? null).asReadonly(),
    progress: signal<any[] | null>(overrides.progress ?? null).asReadonly(),
  };
}

function setup(dataOverrides = {}, actionsOverrides = {}) {
  const dataStub = makeDataStub(dataOverrides);
  const actionsStub = makeActionsStub(actionsOverrides);

  TestBed.configureTestingModule({
    imports: [CardAppStatusComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AppDetailDataService, useValue: dataStub },
      { provide: AppApplicationActionsService, useValue: actionsStub },
    ],
  });

  const fixture: ComponentFixture<CardAppStatusComponent> = TestBed.createComponent(CardAppStatusComponent);
  fixture.detectChanges();
  return { fixture, dataStub, actionsStub };
}

describe('CardAppStatusComponent', () => {
  it('should create', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('State row — idle', () => {
    it('shows STARTED when app is running and no action in flight', () => {
      const { fixture } = setup({ state: 'STARTED' });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('STARTED');
    });

    it('shows STOPPED for a stopped app', () => {
      const { fixture } = setup({ state: 'STOPPED' });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('STOPPED');
    });

    it('applies text-success class for STARTED state', () => {
      const { fixture } = setup({ state: 'STARTED' });
      const component = fixture.componentInstance;
      expect(component.stateClasses()).toContain('text-success');
    });

    it('applies text-content-secondary class for STOPPED state', () => {
      const { fixture } = setup({ state: 'STOPPED' });
      const component = fixture.componentInstance;
      expect(component.stateClasses()).toContain('text-content-secondary');
    });

    it('applies text-danger class for CRASHED state', () => {
      const { fixture } = setup({ state: 'CRASHED' });
      const component = fixture.componentInstance;
      expect(component.stateClasses()).toContain('text-danger');
    });
  });

  describe('State row — in-flight', () => {
    it('shows verb label when action is in flight', () => {
      const { fixture } = setup({}, { inFlight: true, verb: 'RESTARTING' });
      const component = fixture.componentInstance;
      expect(component.stateLabel()).toBe('RESTARTING');
    });

    it('applies amber + pulse classes when in flight', () => {
      const { fixture } = setup({}, { inFlight: true, verb: 'STOPPING' });
      const component = fixture.componentInstance;
      const cls = component.stateClasses();
      expect(cls).toContain('text-warning');
      expect(cls).toContain('animate-pulse');
    });
  });

  describe('Transition row (app-stage-row)', () => {
    it('renders app-stage-row when in-flight and progress is non-empty', () => {
      const progress = [
        { code: 'STAGING', label: 'Staging', index: 1, of: 2, enteredAt: '' },
      ];
      const { fixture } = setup({}, { inFlight: true, verb: 'RESTAGING', progress });
      const stageRow = fixture.nativeElement.querySelector('app-stage-row');
      expect(stageRow).toBeTruthy();
    });

    it('hides app-stage-row when not in flight', () => {
      const { fixture } = setup({}, { inFlight: false });
      const stageRow = fixture.nativeElement.querySelector('app-stage-row');
      expect(stageRow).toBeNull();
    });

    it('hides app-stage-row when in-flight but progress is null', () => {
      const { fixture } = setup({}, { inFlight: true, verb: 'STARTING', progress: null });
      const stageRow = fixture.nativeElement.querySelector('app-stage-row');
      expect(stageRow).toBeNull();
    });

    it('hides app-stage-row when in-flight but progress is empty array', () => {
      const { fixture } = setup({}, { inFlight: true, verb: 'STARTING', progress: [] });
      const stageRow = fixture.nativeElement.querySelector('app-stage-row');
      expect(stageRow).toBeNull();
    });
  });

  describe('Instances row', () => {
    it('shows running/total count when idle', () => {
      const { fixture } = setup({ statsRunning: 2, statsTotal: 3 });
      const component = fixture.componentInstance;
      expect(component.instancesLabel()).toBe('2/3 running');
    });

    it('shows 0/0 when stats are empty', () => {
      const { fixture } = setup({ statsRunning: 0, statsTotal: 0 });
      const component = fixture.componentInstance;
      expect(component.instancesLabel()).toBe('0/0 running');
    });

    it('shows updating… when in-flight and last poll was more than 7 seconds ago', () => {
      const staleDate = new Date(Date.now() - 10_000); // 10 seconds ago
      const { fixture } = setup(
        { lastPolledAt: staleDate, statsRunning: 2, statsTotal: 2 },
        { inFlight: true, verb: 'RESTARTING' },
      );
      const component = fixture.componentInstance;
      expect(component.instancesLabel()).toBe('updating…');
    });

    it('shows live count when in-flight but polled recently (within 7s)', () => {
      const freshDate = new Date(Date.now() - 2_000); // 2 seconds ago
      const { fixture } = setup(
        { lastPolledAt: freshDate, statsRunning: 1, statsTotal: 2 },
        { inFlight: true, verb: 'RESTARTING' },
      );
      const component = fixture.componentInstance;
      expect(component.instancesLabel()).toBe('1/2 running');
    });
  });

  describe('Memory and Disk rows', () => {
    it('renders the Memory and Disk rows', () => {
      const { fixture } = setup({ memoryMb: 512, diskMb: 2048 });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('Memory');
      expect(html).toContain('Disk');
    });
  });
});
