import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { describe, it, expect } from 'vitest';

import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppLifecycleProgressComponent } from './app-lifecycle-progress.component';

/**
 * Minimal mock for AppApplicationActionsService — only the signals/computeds
 * read by the component template are needed.
 */
function makeActionsMock(overrides: {
  showProgress?: boolean;
  inFlight?: boolean;
  verb?: string | null;
  displayLabel?: string;
  currentTarget?: { app: string; cf: string; org: string; space: string } | null;
  progress?: any[] | null;
  outcome?: 'success' | 'fail' | null;
  outcomeError?: string | null;
  log?: any[];
} = {}) {
  return {
    showProgress: signal(overrides.showProgress ?? false).asReadonly(),
    inFlight: signal(overrides.inFlight ?? false).asReadonly(),
    verb: signal(overrides.verb ?? null).asReadonly(),
    displayLabel: signal(overrides.displayLabel ?? '').asReadonly(),
    currentTarget: signal(overrides.currentTarget ?? null).asReadonly(),
    progress: signal(overrides.progress ?? null).asReadonly(),
    outcome: signal(overrides.outcome ?? null).asReadonly(),
    outcomeError: signal(overrides.outcomeError ?? null).asReadonly(),
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
  it('renders the panel during the showProgress window (in flight)', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: true,
      displayLabel: 'Restarting',
      currentTarget: { app: 'my-app', cf: 'cf1', org: 'my-org', space: 'my-space' },
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel).toBeTruthy();
  });

  it('renders the panel during the linger window (terminal state)', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: false,
      outcome: 'success',
      displayLabel: 'Restarted',
      currentTarget: { app: 'my-app', cf: 'cf1', org: 'my-org', space: 'my-space' },
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel).toBeTruthy();
  });

  it('does not render the panel when showProgress is false', async () => {
    const { root } = await setUp({ showProgress: false });
    const panel = root.querySelector('[role="status"]');
    expect(panel).toBeFalsy();
  });

  it('renders the displayLabel', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: true,
      displayLabel: 'Restaging',
      currentTarget: { app: 'target-app', cf: 'cf1', org: 'org1', space: 'space1' },
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel?.textContent).toContain('Restaging');
  });

  it('renders the app name from currentTarget', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: true,
      displayLabel: 'Starting',
      currentTarget: { app: 'hello-world', cf: 'prod-cf', org: 'oss', space: 'dev' },
    });

    const panel = root.querySelector('[role="status"]');
    expect(panel?.textContent).toContain('hello-world');
  });

  it('renders cf / org / space context from currentTarget', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: true,
      displayLabel: 'Stopping',
      currentTarget: { app: 'some-app', cf: 'my-cf', org: 'acme-org', space: 'staging' },
    });

    const text = root.querySelector('[role="status"]')?.textContent ?? '';
    expect(text).toContain('my-cf');
    expect(text).toContain('acme-org');
    expect(text).toContain('staging');
  });

  it('renders outcomeError text when outcome is fail', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: false,
      outcome: 'fail',
      outcomeError: 'CF returned 502',
      displayLabel: 'Restart failed',
      currentTarget: { app: 'broken-app', cf: 'cf1', org: 'org1', space: 'space1' },
    });

    const text = root.querySelector('[role="status"]')?.textContent ?? '';
    expect(text).toContain('CF returned 502');
  });

  it('renders app-stage-row when progress has stages', async () => {
    const { root } = await setUp({
      showProgress: true,
      inFlight: true,
      displayLabel: 'Restaging',
      currentTarget: { app: 'staged-app', cf: 'cf1', org: 'org1', space: 'space1' },
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
      showProgress: true,
      inFlight: true,
      displayLabel: 'Starting',
      currentTarget: { app: 'an-app', cf: 'cf1', org: 'org1', space: 'space1' },
      progress: [],
    });

    const stageRow = root.querySelector('app-stage-row');
    expect(stageRow).toBeFalsy();
  });
});
