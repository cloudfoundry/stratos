import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EndpointsDataService } from '@stratosui/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectEndpointDialogComponent } from '../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { EndpointReauthReportService } from './endpoint-reauth-report.service';
import { TailwindDialogService } from './tailwind-dialog.service';
import { TailwindSnackBarService } from './tailwind-snackbar.service';

// Minimal EndpointModel shape — only the fields reportOnce() reads.
type StubEndpoint = {
  name: string;
  guid: string;
  cnsi_type: string;
  sub_type: string;
  sso_allowed: boolean;
  connectionStatus: string;
  user?: { name: string };
};

// EndpointsDataService stub — reportOnce() awaits whenReady() then reads
// endpointsList(). Same stub style as cf-api-interceptor.spec.ts.
const endpointsListSignal = signal<StubEndpoint[]>([]);
const endpointsDataStub = {
  whenReady: vi.fn(() => Promise.resolve()),
  endpointsList: endpointsListSignal,
};

// TailwindSnackBarService.error() stub — captures the ref so tests can
// trigger its action via dismissWithAction(), same as the real
// TailwindSnackBarRefImpl contract (onAction() fires on dismissWithAction()).
const onActionSubscribers: Array<() => void> = [];
const snackBarStub = {
  error: vi.fn((_msg: string, _action?: string) => ({
    onAction: () => ({
      subscribe: (cb: () => void) => { onActionSubscribers.push(cb); },
    }),
  })),
};

const dialogStub = { open: vi.fn() };

describe('EndpointReauthReportService', () => {
  let router: Router;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    endpointsListSignal.set([]);
    endpointsDataStub.whenReady.mockClear();
    snackBarStub.error.mockClear();
    dialogStub.open.mockClear();
    onActionSubscribers.length = 0;

    TestBed.configureTestingModule({
      providers: [
        { provide: EndpointsDataService, useValue: endpointsDataStub },
        { provide: TailwindSnackBarService, useValue: snackBarStub },
        { provide: TailwindDialogService, useValue: dialogStub },
      ],
    });
    router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  const triggerAction = () => onActionSubscribers.forEach(cb => cb());

  it('no expired endpoints -> no snackbar', async () => {
    endpointsListSignal.set([
      { name: 'Alpha', guid: 'g1', cnsi_type: 'cf', sub_type: '', sso_allowed: false, connectionStatus: 'connected' },
    ]);
    const service = TestBed.inject(EndpointReauthReportService);

    await service.reportOnce();

    expect(snackBarStub.error).not.toHaveBeenCalled();
  });

  it('one expired endpoint -> named snackbar with Reconnect action that opens the connect dialog', async () => {
    endpointsListSignal.set([
      {
        name: 'Alpha', guid: 'g1', cnsi_type: 'cf', sub_type: '', sso_allowed: true,
        connectionStatus: 'expired', user: { name: 'admin' },
      },
    ]);
    const service = TestBed.inject(EndpointReauthReportService);

    await service.reportOnce();

    expect(snackBarStub.error).toHaveBeenCalledTimes(1);
    expect(snackBarStub.error.mock.calls[0][0]).toContain("'Alpha'");
    expect(snackBarStub.error.mock.calls[0][0]).toContain('needs re-authentication');
    expect(snackBarStub.error.mock.calls[0][1]).toBe('Reconnect');

    triggerAction();

    expect(dialogStub.open).toHaveBeenCalledTimes(1);
    const [component, config] = dialogStub.open.mock.calls[0];
    expect(component).toBe(ConnectEndpointDialogComponent);
    expect(config.data).toEqual({
      name: 'Alpha', guid: 'g1', type: 'cf', subType: '', ssoAllowed: true, username: 'admin',
    });
  });

  it('two expired endpoints -> count snackbar with View action that navigates to /endpoints', async () => {
    endpointsListSignal.set([
      { name: 'Alpha', guid: 'g1', cnsi_type: 'cf', sub_type: '', sso_allowed: true, connectionStatus: 'expired' },
      { name: 'Beta', guid: 'g2', cnsi_type: 'cf', sub_type: '', sso_allowed: true, connectionStatus: 'expired' },
    ]);
    const service = TestBed.inject(EndpointReauthReportService);

    await service.reportOnce();

    expect(snackBarStub.error).toHaveBeenCalledTimes(1);
    expect(snackBarStub.error.mock.calls[0][0]).toContain('2 endpoints need re-authentication');
    expect(snackBarStub.error.mock.calls[0][1]).toBe('View');

    triggerAction();

    expect(dialogStub.open).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/endpoints']);
  });

  it('second reportOnce() call fires nothing again', async () => {
    endpointsListSignal.set([
      { name: 'Alpha', guid: 'g1', cnsi_type: 'cf', sub_type: '', sso_allowed: true, connectionStatus: 'expired' },
    ]);
    const service = TestBed.inject(EndpointReauthReportService);

    await service.reportOnce();
    expect(snackBarStub.error).toHaveBeenCalledTimes(1);

    await service.reportOnce();
    expect(snackBarStub.error).toHaveBeenCalledTimes(1);
    expect(endpointsDataStub.whenReady).toHaveBeenCalledTimes(1);
  });
});
