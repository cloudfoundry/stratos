import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import type { EndpointModel } from '@stratosui/store';
import { UserFavoriteManager } from '@stratosui/store';

import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { EndpointAuthStateService } from '../../../shared/services/endpoint-auth-state.service';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { EndpointRowActionsService } from '../endpoint-row-actions.service';
import { EndpointsSignalConfigService } from './endpoints-signal-config.service';
import { EndpointsSignalListComponent } from './endpoints-signal-list.component';

function ep(connectionStatus: string, guid = 'guid-1'): EndpointModel {
  return { guid, name: 'ep1', cnsi_type: 'cf', connectionStatus } as unknown as EndpointModel;
}

// Minimal stand-in for EndpointsSignalConfigService - the component's
// constructor only reads these fields to build listConfig(); none of the
// actual filter/sort/paging behaviour is exercised here (that's
// view-pipeline.spec.ts's job).
function makeEndpointsConfigStub(): EndpointsSignalConfigService {
  return {
    initialize: vi.fn(),
    view: {
      pagedItems: signal<EndpointModel[]>([]),
      totalFilteredResults: signal(0),
      totalPages: signal(0),
      totalItems: signal(0),
    },
    pageIndex: signal(0),
    pageSize: signal(25),
    loading: signal(false),
    nameFilter: signal(''),
    viewMode: signal('table'),
    sort: signal({ field: 'name', direction: 'asc' }),
    registerSortExtractor: vi.fn(),
    refresh: vi.fn(),
    clearFilters: vi.fn(),
    disconnectEndpoint: vi.fn(),
    unregisterEndpoint: vi.fn(),
  } as unknown as EndpointsSignalConfigService;
}

describe('EndpointsSignalListComponent - expired status + reconnect action', () => {
  let component: EndpointsSignalListComponent;
  let authState: EndpointAuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsSignalConfigService, useValue: makeEndpointsConfigStub() },
        { provide: UserFavoriteManager, useValue: { getAllFavorites: () => of([{}, {}]) } as unknown as UserFavoriteManager },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ConfirmationDialogService, useValue: { open: vi.fn() } },
        { provide: TailwindDialogService, useValue: { open: vi.fn() } },
        { provide: TailwindSnackBarService, useValue: { show: vi.fn() } },
        // Real row-actions + auth-state services so the action gate under
        // test is the actual production wiring, not a stub of itself.
        EndpointRowActionsService,
        EndpointAuthStateService,
      ],
    });
    const fixture = TestBed.createComponent(EndpointsSignalListComponent);
    component = fixture.componentInstance;
    authState = TestBed.inject(EndpointAuthStateService);
  });

  function statusColumn() {
    const col = component.listConfig()!.columns.find(c => c.key === 'status');
    if (!col) throw new Error('status column not found');
    return col;
  }

  function actionsColumn() {
    const col = component.listConfig()!.columns.find(c => c.key === 'actions');
    if (!col) throw new Error('actions column not found');
    return col;
  }

  it('renders an expired endpoint as "Expired" with the warning pill color, and offers Reconnect + Disconnect', () => {
    const endpoint = ep('expired');
    const status = statusColumn();
    expect(status.render(endpoint)).toBe('Expired');
    expect(status.pillColor?.(endpoint)).toBe('warning');

    const labels = actionsColumn().actions!(endpoint).map(a => a.label);
    expect(labels).toContain('Reconnect');
    expect(labels).toContain('Disconnect');
  });

  it('keeps today\'s behavior for a healthy connected endpoint: "Connected", success color, Disconnect + Reconnect', () => {
    const endpoint = ep('connected');
    const status = statusColumn();
    expect(status.render(endpoint)).toBe('Connected');
    expect(status.pillColor?.(endpoint)).toBe('success');

    const labels = actionsColumn().actions!(endpoint).map(a => a.label);
    expect(labels).toContain('Reconnect');
    expect(labels).toContain('Disconnect');
  });

  it('overlays "Expired" (warning) on a connected endpoint the interceptor marked stale this session', () => {
    const endpoint = ep('connected', 'guid-stale');
    authState.markStale('guid-stale');

    const status = statusColumn();
    expect(status.render(endpoint)).toBe('Expired');
    expect(status.pillColor?.(endpoint)).toBe('warning');
  });
});
