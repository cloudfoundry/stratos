import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { CurrentUserRolesDataService, StratosCatalogEndpointEntity, entityCatalog, type EndpointModel } from '@stratosui/store';

import { SessionSignalService } from '../../core/signals/session-signal.service';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { EndpointAuthStateService } from '../../shared/services/endpoint-auth-state.service';
import { TailwindDialogService } from '../../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../../shared/services/tailwind-snackbar.service';
import { EndpointRowActionsService } from './endpoint-row-actions.service';
import { EndpointsSignalConfigService } from './endpoints-page/endpoints-signal-config.service';

const SYSTEM = { name: 'System Endpoint', admin: false, system: true };

function ep(connectionStatus: string, guid = 'guid-1', extra: Partial<EndpointModel> = {}): EndpointModel {
  return { guid, name: 'ep1', cnsi_type: 'cf', connectionStatus, creator: SYSTEM, ...extra } as unknown as EndpointModel;
}

describe('EndpointRowActionsService', () => {
  let service: EndpointRowActionsService;
  let tailwindDialog: { open: ReturnType<typeof vi.fn> };
  let authState: EndpointAuthStateService;
  const userEndpointsEnabled = signal(false);
  const userEndpointsNotDisabled = signal(false);

  const signIn = (admin: boolean, scopes: string[] = []) =>
    TestBed.inject(CurrentUserRolesDataService).applySessionScopes({ admin, guid: 'me-guid', name: 'me', scopes });

  const labels = (row: EndpointModel, opts?: { unregister?: boolean }) =>
    service.buildEndpointActions(row, opts).map(a => a.label);

  beforeEach(() => {
    tailwindDialog = { open: vi.fn() };
    userEndpointsEnabled.set(false);
    userEndpointsNotDisabled.set(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: EndpointsSignalConfigService, useValue: { unregister: vi.fn().mockResolvedValue({ error: false }) } },
        { provide: ConfirmationDialogService, useValue: { open: vi.fn(), openWithCancel: vi.fn() } },
        { provide: TailwindDialogService, useValue: tailwindDialog },
        { provide: TailwindSnackBarService, useValue: { show: vi.fn() } },
        {
          provide: SessionSignalService,
          useValue: {
            sessionData: signal({ user: { name: 'me' } }),
            userEndpointsEnabled,
            userEndpointsNotDisabled,
          },
        },
      ],
    });
    service = TestBed.inject(EndpointRowActionsService);
    authState = TestBed.inject(EndpointAuthStateService);
    signIn(true);
  });

  it('offers Disconnect and Reconnect for a connected endpoint', () => {
    expect(labels(ep('connected'))).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  it('offers Connect for a disconnected endpoint', () => {
    expect(labels(ep('disconnected'))).toEqual(['Connect', 'Edit', 'Unregister']);
  });

  it('omits Unregister for projection surfaces like the CF picker', () => {
    expect(labels(ep('connected'), { unregister: false })).toEqual(['Disconnect', 'Reconnect', 'Edit']);
  });

  it('Reconnect opens the connect dialog in place (no disconnect step)', () => {
    const actions = service.buildEndpointActions(ep('connected'));
    const reconnect = actions.find(a => a.label === 'Reconnect');
    reconnect?.invoke(ep('connected'));
    expect(tailwindDialog.open).toHaveBeenCalledTimes(1);
  });

  it('offers Disconnect and Reconnect for an expired endpoint', () => {
    expect(labels(ep('expired'))).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  it('offers Disconnect and Reconnect for a connected endpoint the interceptor marked stale this session', () => {
    authState.markStale('guid-1');
    expect(labels(ep('connected', 'guid-1'))).toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  // The same question the Register step's Unregister… asks
  describe('Unregister', () => {
    let confirm: ReturnType<typeof vi.fn>;
    let unregister: ReturnType<typeof vi.fn>;
    let show: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      confirm = TestBed.inject(ConfirmationDialogService).openWithCancel as ReturnType<typeof vi.fn>;
      unregister = (TestBed.inject(EndpointsSignalConfigService) as unknown as { unregister: ReturnType<typeof vi.fn> }).unregister;
      show = TestBed.inject(TailwindSnackBarService).show as ReturnType<typeof vi.fn>;
    });

    const invoke = (row: EndpointModel) => service.buildEndpointActions(row).find(a => a.label === 'Unregister')!.invoke(row);

    // The question stays open: these look only at what it asks.
    it('asks "Unregister ep1?" with Keep it', () => {
      void invoke(ep('connected'));
      const config = confirm.mock.calls[0][0];
      expect(config.title).toBe('Unregister ep1?');
      expect(config.message).toBe('This removes the endpoint for all users and ends every connection to it. You can register it again later.');
      expect([config.cancel, config.confirm, config.critical]).toEqual(['Keep it', 'Unregister', true]);
    });

    it('says "for you" on a personal endpoint', () => {
      void invoke(ep('connected', 'guid-1', { creator: { name: 'me', admin: false, system: false } }));
      expect(confirm.mock.calls[0][0].message).toContain('removes the endpoint for you');
    });

    it('unregisters and says so once confirmed', async () => {
      confirm.mockImplementation((_config, onConfirm) => onConfirm());
      await invoke(ep('connected'));
      await vi.waitFor(() => expect(show).toHaveBeenCalledWith('Unregistered ep1'));
      expect(unregister).toHaveBeenCalledWith('guid-1', 'cf');
    });

    it('does nothing when kept', async () => {
      confirm.mockImplementation((_config, _onConfirm, onCancel) => onCancel());
      await invoke(ep('connected'));
      expect(unregister).not.toHaveBeenCalled();
      expect(show).not.toHaveBeenCalled();
    });
  });

  // jetstream lets only a Stratos admin edit or unregister while user
  // endpoints are off (the default).
  it('offers no Edit or Unregister to a user who is not an admin', () => {
    signIn(false, ['stratos.endpointadmin']);
    expect(labels(ep('disconnected'))).toEqual(['Connect']);
  });

  // With user endpoints on, an endpoint admin manages the endpoints they
  // created, and nothing else.
  describe('with user endpoints enabled', () => {
    beforeEach(() => {
      userEndpointsEnabled.set(true);
      userEndpointsNotDisabled.set(true);
      signIn(false, ['stratos.endpointadmin']);
    });

    it('offers an endpoint admin Edit and Unregister for their own endpoint', () => {
      const mine = ep('disconnected', 'guid-1', { creator: { name: 'me', admin: false, system: false } });
      expect(labels(mine)).toEqual(['Connect', 'Edit', 'Unregister']);
    });

    it('offers an endpoint admin no Edit or Unregister for a system endpoint', () => {
      expect(labels(ep('disconnected'))).toEqual(['Connect']);
    });

    it('offers nobody Connect to a personal endpoint another user created', () => {
      signIn(true);
      const theirs = ep('disconnected', 'guid-1', { creator: { name: 'someone', admin: false, system: false } });
      expect(labels(theirs)).toEqual(['Edit', 'Unregister']);
    });
  });

  it('offers only an admin Disconnect of a shared connection', () => {
    signIn(false);
    expect(labels(ep('connected', 'guid-1', { system_shared_token: true }))).toEqual(['Reconnect']);
    signIn(true);
    expect(labels(ep('connected', 'guid-1', { system_shared_token: true })))
      .toEqual(['Disconnect', 'Reconnect', 'Edit', 'Unregister']);
  });

  // A type can add its own actions (Helm repositories: Synchronize).
  it('offers the actions an endpoint type adds, after the common ones', () => {
    const synchronize = vi.fn();
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'typed-actions', label: 'Typed', labelPlural: 'Typed', logoUrl: '', authTypes: [], unConnectable: true,
      endpointListActions: () => [
        { label: 'Synchronize', action: synchronize, createVisible: () => of(true) },
        { label: 'Hidden', action: vi.fn(), createVisible: () => of(false) },
      ],
    }));
    const row = ep('disconnected', 'guid-1', { cnsi_type: 'typed-actions' });
    const actions = service.buildEndpointActions(row);
    expect(actions.map(a => a.label)).toEqual(['Edit', 'Unregister', 'Synchronize']);
    actions.find(a => a.label === 'Synchronize')?.invoke(row);
    expect(synchronize).toHaveBeenCalledWith(row);
  });
});
