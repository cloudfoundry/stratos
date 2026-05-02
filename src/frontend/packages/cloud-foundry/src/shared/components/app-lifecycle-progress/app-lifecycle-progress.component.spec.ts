import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';

import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppLifecycleProgressComponent } from './app-lifecycle-progress.component';

/**
 * Minimal mock for AppApplicationActionsService — only the signals read
 * by the component template are needed.
 */
function makeActionsMock(overrides: {
  inFlight?: boolean;
  verb?: string | null;
  progress?: any[] | null;
  log?: any[];
} = {}) {
  return {
    inFlight: signal(overrides.inFlight ?? false).asReadonly(),
    verb: signal(overrides.verb ?? null).asReadonly(),
    progress: signal(overrides.progress ?? null).asReadonly(),
    log: signal(overrides.log ?? []).asReadonly(),
  };
}

async function setUp(mockOverrides: Parameters<typeof makeActionsMock>[0] = {}) {
  const actionsMock = makeActionsMock(mockOverrides);

  await TestBed.configureTestingModule({
    imports: [AppLifecycleProgressComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: AppApplicationActionsService, useValue: actionsMock },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<AppLifecycleProgressComponent> =
    TestBed.createComponent(AppLifecycleProgressComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement, actionsMock };
}

describe('AppLifecycleProgressComponent', () => {
  it('renders the progress panel when inFlight is true', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'RESTARTING',
      log: [{
        at: new Date(),
        verb: 'RESTARTING',
        event: 'begin',
        target: { app: 'my-app', cf: 'cf1', org: 'my-org', space: 'my-space' },
      }],
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel).toBeTruthy();
  });

  it('does not render the progress panel when inFlight is false', async () => {
    const { root } = await setUp({ inFlight: false });
    const panel = root.querySelector('[role="status"]');
    expect(panel).toBeFalsy();
  });

  it('renders verb from actions.verb()', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'RESTAGING',
      log: [{
        at: new Date(),
        verb: 'RESTAGING',
        event: 'begin',
        target: { app: 'target-app', cf: 'cf1', org: 'org1', space: 'space1' },
      }],
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel?.textContent).toContain('RESTAGING');
  });

  it('renders app name from actions.log()[0].target.app', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'STARTING',
      log: [{
        at: new Date(),
        verb: 'STARTING',
        event: 'begin',
        target: { app: 'hello-world', cf: 'prod-cf', org: 'oss', space: 'dev' },
      }],
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel?.textContent).toContain('hello-world');
  });

  it('renders cf / org / space context from log target', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'STOPPING',
      log: [{
        at: new Date(),
        verb: 'STOPPING',
        event: 'begin',
        target: { app: 'some-app', cf: 'my-cf', org: 'acme-org', space: 'staging' },
      }],
    });

    const text = root.querySelector('[role="status"]')?.textContent ?? '';
    expect(text).toContain('my-cf');
    expect(text).toContain('acme-org');
    expect(text).toContain('staging');
  });

  it('renders app-stage-row when progress has stages', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'RESTAGING',
      log: [{
        at: new Date(),
        verb: 'RESTAGING',
        event: 'stage',
        target: { app: 'staged-app', cf: 'cf1', org: 'org1', space: 'space1' },
      }],
      progress: [
        { code: 'detecting', label: 'Detecting', index: 1, of: 3, enteredAt: '' },
        { code: 'compiling', label: 'Compiling', index: 2, of: 3, enteredAt: '' },
      ],
    });

    const stageRow = root.querySelector('app-stage-row');
    expect(stageRow).toBeTruthy();
  });

  it('does not render app-stage-row when progress is empty', async () => {
    const { root } = await setUp({
      inFlight: true,
      verb: 'STARTING',
      log: [{
        at: new Date(),
        verb: 'STARTING',
        event: 'begin',
        target: { app: 'an-app', cf: 'cf1', org: 'org1', space: 'space1' },
      }],
      progress: [],
    });

    const stageRow = root.querySelector('app-stage-row');
    expect(stageRow).toBeFalsy();
  });
});
