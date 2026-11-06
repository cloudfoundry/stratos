import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EndpointModel } from '@stratosui/store';

import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { EndpointAuthStateService } from '../../shared/services/endpoint-auth-state.service';
import { TailwindDialogService } from '../../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../../shared/services/tailwind-snackbar.service';
import { EndpointRowActionsService } from './endpoint-row-actions.service';
import { EndpointsSignalConfigService } from './endpoints-page/endpoints-signal-config.service';

function ep(connectionStatus: string, guid = 'guid-1'): EndpointModel {
  return { guid, name: 'ep1', cnsi_type: 'cf', connectionStatus } as unknown as EndpointModel;
}

describe('EndpointRowActionsService', () => {
  let service: EndpointRowActionsService;
  let tailwindDialog: { open: ReturnType<typeof vi.fn> };
  let authState: EndpointAuthStateService;

  beforeEach(() => {
    tailwindDialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: EndpointsSignalConfigService, useValue: {} },
        { provide: ConfirmationDialogService, useValue: { open: vi.fn() } },
        { provide: TailwindDialogService, useValue: tailwindDialog },
        { provide: TailwindSnackBarService, useValue: { show: vi.fn() } },
      ],
    });
    service = TestBed.inject(EndpointRowActionsService);
    authState = TestBed.inject(EndpointAuthStateService);
  });

  it('offers Disconnect and Reconnect for a connected endpoint', () => {
    const labels = service.buildEndpointActions(ep('connected')).map(a => a.label);
    expect(labels).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  it('offers Connect for a disconnected endpoint', () => {
    const labels = service.buildEndpointActions(ep('disconnected')).map(a => a.label);
    expect(labels).toEqual(['Connect', 'Edit', 'Unregister']);
  });

  it('omits Unregister for projection surfaces like the CF picker', () => {
    const labels = service.buildEndpointActions(ep('connected'), { unregister: false }).map(a => a.label);
    expect(labels).toEqual(['Disconnect', 'Reconnect', 'Edit']);
  });

  it('Reconnect opens the connect dialog in place (no disconnect step)', () => {
    const actions = service.buildEndpointActions(ep('connected'));
    const reconnect = actions.find(a => a.label === 'Reconnect');
    reconnect?.invoke(ep('connected'));
    expect(tailwindDialog.open).toHaveBeenCalledTimes(1);
  });

  it('offers Disconnect and Reconnect for an expired endpoint', () => {
    const labels = service.buildEndpointActions(ep('expired')).map(a => a.label);
    expect(labels).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  it('offers Disconnect and Reconnect for a connected endpoint the interceptor marked stale this session', () => {
    authState.markStale('guid-1');
    const labels = service.buildEndpointActions(ep('connected', 'guid-1')).map(a => a.label);
    expect(labels).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

});
