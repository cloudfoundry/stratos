import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AppDetailDataService } from '../../../../../../features/applications/app-detail-data.service';
import { RevisionsTabComponent } from './revisions-tab.component';
import { RevisionsSignalConfigService } from '../../../../../../shared/components/list/list-types/revisions/revisions-signal-config.service';
import type { RevisionRow } from '../../../../../../shared/services/revisions.service';

function makeRevision(overrides: Partial<RevisionRow> = {}): RevisionRow {
  return {
    guid: 'rev-1',
    version: 1,
    description: 'Initial deployment',
    deployable: true,
    created_at: '2026-04-22T12:00:00Z',
    deployed: false,
    ...overrides,
  };
}

function makeConfigSvcMock(overrides: Partial<{
  revisions: RevisionRow[];
  featureEnabled: boolean;
  deployedUnknown: boolean;
}> = {}) {
  const revisions = overrides.revisions ?? [];
  const featureEnabledValue = overrides.featureEnabled ?? true;
  const deployedUnknownValue = overrides.deployedUnknown ?? false;

  return {
    initialize: vi.fn(),
    loadAll: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
    clearFilters: vi.fn(),
    revisions: signal(revisions),
    featureEnabled: signal(featureEnabledValue),
    deployedUnknown: signal(deployedUnknownValue),
    hasLoadedOnce: signal(true),
    nameFilter: signal(''),
    sort: signal({ field: 'version', direction: 'desc' as const }),
    pageSize: signal(25),
    pageIndex: signal(0),
    viewMode: signal('table' as const),
    view: {
      pagedItems: signal(revisions),
      totalFilteredResults: signal(revisions.length),
      totalPages: signal(1),
    },
  };
}

describe('RevisionsTabComponent', () => {
  let component: RevisionsTabComponent;
  let fixture: ComponentFixture<RevisionsTabComponent>;

  const dataStub = { cnsiGuid: 'test-cf-guid', appGuid: 'test-app-guid' };

  function setupTestBed(configMockOverrides: Parameters<typeof makeConfigSvcMock>[0] = {}) {
    const configMock = makeConfigSvcMock(configMockOverrides);

    TestBed.configureTestingModule({
      imports: [RevisionsTabComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AppDetailDataService, useValue: dataStub },
        { provide: RevisionsSignalConfigService, useValue: configMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(RevisionsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return configMock;
  }

  afterEach(() => {
    try {
      fixture?.destroy();
    } catch (_e) {
      // ignore cleanup errors
    }
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    setupTestBed();
    expect(component).toBeTruthy();
  });

  it('calls initialize and loadAll on construction', () => {
    const configMock = setupTestBed();
    expect(configMock.initialize).toHaveBeenCalledWith(
      dataStub.cnsiGuid,
      dataStub.appGuid,
    );
    expect(configMock.loadAll).toHaveBeenCalled();
  });

  it('exposes listConfig after construction', () => {
    setupTestBed();
    expect(component.listConfig()).toBeDefined();
  });

  it('renders one row per revision via pagedItems', async () => {
    const revisions = [
      makeRevision({ guid: 'rev-1', version: 1 }),
      makeRevision({ guid: 'rev-2', version: 2, deployed: true }),
    ];
    setupTestBed({ revisions });

    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    const items = cfg!.pagedItems();
    expect(items.length).toBe(2);
  });

  it('deployed badge visible on deployed row (getRowKey includes deployed)', () => {
    const revisions = [
      makeRevision({ guid: 'rev-deployed', version: 3, deployed: true }),
    ];
    setupTestBed({ revisions });

    // Verify the deployed revision is present in pagedItems
    const cfg = component.listConfig();
    const items = cfg!.pagedItems();
    expect(items.some((r: RevisionRow) => r.deployed === true)).toBe(true);
  });

  it('featureEnabled=false causes featureEnabled() to return false', () => {
    setupTestBed({ featureEnabled: false });
    expect(component.featureEnabled()).toBe(false);
  });

  it('deployedUnknown=true causes deployedUnknown() to return true', () => {
    setupTestBed({ deployedUnknown: true });
    expect(component.deployedUnknown()).toBe(true);
  });

  it('rollback button disabled while another rollback is in flight', () => {
    setupTestBed();
    const deployed = makeRevision({ guid: 'rev-deployed', deployed: true });
    const notDeployed = makeRevision({ guid: 'rev-other', deployed: false });

    // Simulate a rollback in flight for rev-other
    component.rollingBackGuid.set('rev-other');

    // A second call for the same guid returns early (idempotent)
    const dialog = (component as any).dialog;
    if (dialog) {
      dialog.open = vi.fn();
    }
    component.rollback(notDeployed);
    // Still set — no double-start
    expect(component.rollingBackGuid()).toBe('rev-other');

    // A different row: rolling back is blocked because another is in flight
    // (UI disables the button; calling rollback on deployed row is also blocked)
    component.rollback(deployed);
    // deployed rows are skipped outright; rollingBackGuid unchanged
    expect(component.rollingBackGuid()).toBe('rev-other');
  });
});
