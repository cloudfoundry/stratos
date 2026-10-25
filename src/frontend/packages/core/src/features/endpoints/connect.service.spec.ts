import { ChangeDetectionStrategy, Component, computed, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionState, EndpointFetchingState, EndpointModel, EndpointsDataService } from '@stratosui/store';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EndpointsService } from '../../core/endpoints.service';
import { ConnectEndpointConfig, ConnectEndpointService } from './connect.service';

// Stands in for the page or stepper step whose injector each connect is
// given; it lives across many connects.
@Component({
  selector: 'app-connect-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConnectHostComponent {}

const config: ConnectEndpointConfig = {
  name: 'ep',
  guid: 'ep-1',
  type: 'cf',
  subType: '',
  ssoAllowed: false,
};

// Per-guid sources read through computeds that count their evaluations, so
// an effect still watching them shows up as extra reads after a write.
function fakeEndpointsData() {
  const connecting = signal<ActionState>({ busy: false, error: false, message: '' });
  const fetching = signal<EndpointFetchingState>({ fetching: false });
  const endpoint = signal<EndpointModel | null>(null);
  let reads = 0;
  const counted = <T>(source: () => T) => computed(() => {
    reads++;
    return source();
  });
  const data = {
    connectingState: () => counted(connecting),
    fetchingState: () => counted(fetching),
    endpointById: () => counted(endpoint),
  } as unknown as EndpointsDataService;
  return { data, connecting, fetching, endpoint, reads: () => reads };
}

describe('ConnectEndpointService', () => {
  const endpointsService = { checkEndpoint: vi.fn() } as unknown as EndpointsService;

  async function setup() {
    const fixture = TestBed.createComponent(ConnectHostComponent);
    await fixture.whenStable();
    const injector = fixture.debugElement.injector.get(Injector);
    return { fixture, injector, ...fakeEndpointsData() };
  }

  afterEach(() => vi.restoreAllMocks());

  it('forwards source writes while the connect is live', async () => {
    const { fixture, injector, data, connecting } = await setup();
    const service = new ConnectEndpointService(endpointsService, config, data, injector);
    const busy: boolean[] = [];
    const sub = service.isBusy$.subscribe(b => busy.push(b));
    await fixture.whenStable();

    connecting.set({ busy: true, error: false, message: '' });
    await fixture.whenStable();

    expect(busy).toContain(true);
    sub.unsubscribe();
    service.destroy();
  });

  it('stops reading the sources after destroy()', async () => {
    const { fixture, injector, data, connecting, fetching, endpoint, reads } = await setup();
    const service = new ConnectEndpointService(endpointsService, config, data, injector);
    await fixture.whenStable();
    expect(reads()).toBeGreaterThan(0);

    service.destroy();
    const readsAtDestroy = reads();
    connecting.set({ busy: true, error: false, message: '' });
    fetching.set({ fetching: true });
    endpoint.set({ guid: 'ep-1' } as EndpointModel);
    await fixture.whenStable();

    expect(reads() - readsAtDestroy).toBe(0);
  });

  it('does not keep bridges from earlier connects in the same injector', async () => {
    const { fixture, injector, data, connecting, reads } = await setup();
    // A stepper re-entry or a kube-config import makes a connect per pass.
    for (let i = 0; i < 5; i++) {
      new ConnectEndpointService(endpointsService, config, data, injector).destroy();
    }
    const live = new ConnectEndpointService(endpointsService, config, data, injector);
    await fixture.whenStable();

    const before = reads();
    connecting.set({ busy: true, error: false, message: '' });
    await fixture.whenStable();

    // Only the live connect's connecting-state bridge re-reads.
    expect(reads() - before).toBe(1);
    live.destroy();
  });

  // An endpoint editor can change TLS options in the connect form; they
  // are saved to the endpoint, then the connect runs with them.
  describe('TLS options', () => {
    const stored = { guid: 'ep-1', name: 'ep', cnsi_type: 'cf', sso_allowed: true, skip_ssl_validation: false, ca_cert: '' } as EndpointModel;

    async function tlsSetup(updateResult: ActionState, connectResult: ActionState = { busy: false, error: false, message: '' }) {
      const base = await setup();
      const calls: string[] = [];
      const endpoints = signal(new Map([['ep-1', stored]]));
      // Like the real update, a saved change shows in the endpoint list
      const update = vi.fn(async (_guid: string, opts: { skipSSL: boolean; caCert: string }) => {
        calls.push('update');
        if (!updateResult.error) {
          endpoints.set(new Map([['ep-1', { ...stored, skip_ssl_validation: opts.skipSSL, ca_cert: opts.caCert }]]));
        }
        return updateResult;
      });
      const connect = vi.fn(async () => { calls.push('connect'); return connectResult; });
      Object.assign(base.data, { endpoints, update, connect });
      const service = new ConnectEndpointService(endpointsService, config, base.data, base.injector);
      return { ...base, service, update, connect, calls, endpoints };
    }

    const submitWith = (service: ConnectEndpointService, tls: { skipSSL: boolean; caCert: string }) => {
      service.setData({ authType: 'creds', authVal: { username: 'u', password: 'p' }, systemShared: false, bodyContent: '', tls });
      return firstValueFrom(service.submit());
    };

    it('saves changed options, then connects', async () => {
      const { service, update, calls } = await tlsSetup({ busy: false, error: false, message: '' });
      const result = await submitWith(service, { skipSSL: true, caCert: '' });
      expect(result.success).toBe(true);
      expect(calls).toEqual(['update', 'connect']);
      expect(update).toHaveBeenCalledWith('ep-1', {
        endpointType: 'cf', name: 'ep', skipSSL: true, setClientInfo: false, allowSSO: true, caCert: '',
      });
      service.destroy();
    });

    it('does not connect when saving fails, and says why', async () => {
      const { fixture, service, connect } = await tlsSetup({ busy: false, error: true, message: 'SSL error' });
      const errors: (string | null)[] = [];
      const sub = service.connectingError$.subscribe(e => errors.push(e));
      const result = await submitWith(service, { skipSSL: false, caCert: 'PEM' });
      await fixture.whenStable();
      expect(result).toEqual({ success: false, errorMessage: 'SSL error' });
      expect(connect).not.toHaveBeenCalled();
      expect(errors).toContain('SSL error');
      sub.unsubscribe();
      service.destroy();
    });

    it('connects without saving when the options are unchanged', async () => {
      const { service, calls } = await tlsSetup({ busy: false, error: false, message: '' });
      await submitWith(service, { skipSSL: false, caCert: '' });
      expect(calls).toEqual(['connect']);
      service.destroy();
    });

    // A failed connect must not leave the endpoint changed: the options go
    // back to what they were, and the next attempt saves them again.
    it('puts the options back when the connect fails', async () => {
      const { service, update, calls, endpoints } = await tlsSetup(
        { busy: false, error: false, message: '' },
        { busy: false, error: true, message: 'Unauthorized' },
      );
      const result = await submitWith(service, { skipSSL: true, caCert: '' });
      expect(result).toEqual({ success: false, errorMessage: 'Unauthorized' });
      expect(calls).toEqual(['update', 'connect', 'update']);
      expect(update).toHaveBeenNthCalledWith(1, 'ep-1', {
        endpointType: 'cf', name: 'ep', skipSSL: true, setClientInfo: false, allowSSO: true, caCert: '',
      });
      expect(update).toHaveBeenNthCalledWith(2, 'ep-1', {
        endpointType: 'cf', name: 'ep', skipSSL: false, setClientInfo: false, allowSSO: true, caCert: '',
      });
      expect(endpoints().get('ep-1')?.skip_ssl_validation).toBe(false);

      await submitWith(service, { skipSSL: true, caCert: '' });
      expect(calls).toEqual(['update', 'connect', 'update', 'update', 'connect', 'update']);
      service.destroy();
    });

    it('puts back a replaced CA certificate', async () => {
      const { service, update, endpoints } = await tlsSetup(
        { busy: false, error: false, message: '' },
        { busy: false, error: true, message: 'Unauthorized' },
      );
      endpoints.set(new Map([['ep-1', { ...stored, ca_cert: 'OLD PEM' }]]));
      await submitWith(service, { skipSSL: false, caCert: 'NEW PEM' });
      expect(update).toHaveBeenNthCalledWith(2, 'ep-1', expect.objectContaining({ skipSSL: false, caCert: 'OLD PEM' }));
      service.destroy();
    });

    it('says so when the options could not be put back', async () => {
      const { fixture, service, update } = await tlsSetup(
        { busy: false, error: false, message: '' },
        { busy: false, error: true, message: 'Unauthorized' },
      );
      const errors: (string | null)[] = [];
      const sub = service.connectingError$.subscribe(e => errors.push(e));
      // The dialog is up, its state bridges running, before Connect is pressed
      await fixture.whenStable();
      update.mockImplementationOnce(async () => ({ busy: false, error: false, message: '' }))
        .mockImplementationOnce(async () => ({ busy: false, error: true, message: 'Bad Gateway' }));
      const result = await submitWith(service, { skipSSL: true, caCert: '' });
      await fixture.whenStable();
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe(errors.at(-1));
      expect(errors.at(-1)).toContain('Unauthorized');
      expect(errors.at(-1)).toContain('could not be restored');
      sub.unsubscribe();
      service.destroy();
    });

    it('keeps the saved options when the connect succeeds', async () => {
      const { service, calls } = await tlsSetup({ busy: false, error: false, message: '' });
      await submitWith(service, { skipSSL: true, caCert: '' });
      expect(calls).toEqual(['update', 'connect']);
      service.destroy();
    });
  });

  // Enter in the form while a connect runs must not start a second one; the
  // second submit gets the first one's result.
  it('runs one connect for submits made while it is in flight', async () => {
    const { injector, data } = await setup();
    let finish!: (state: ActionState) => void;
    const connect = vi.fn(() => new Promise<ActionState>(resolve => { finish = resolve; }));
    Object.assign(data, { endpoints: signal(new Map()), connect });
    const service = new ConnectEndpointService(endpointsService, config, data, injector);
    service.setData({ authType: 'creds', authVal: { username: 'u', password: 'p' }, systemShared: false, bodyContent: '' });

    const first = firstValueFrom(service.submit());
    const second = firstValueFrom(service.submit());
    await vi.waitFor(() => expect(connect).toHaveBeenCalled());
    finish({ busy: false, error: false, message: '' });

    expect(await first).toEqual({ success: true, errorMessage: '' });
    expect(await second).toEqual({ success: true, errorMessage: '' });
    expect(connect).toHaveBeenCalledTimes(1);

    // A later submit connects again.
    const third = firstValueFrom(service.submit());
    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(2));
    finish({ busy: false, error: false, message: '' });
    await third;
    service.destroy();
  });

  // The dialog closes on hasConnected$. An endpoint being Reconnected is
  // connected before, during and after the attempt, so its being connected
  // says nothing about how the attempt went.
  describe('reporting a connect', () => {
    const connectedEndpoint = { guid: 'ep-1', name: 'ep', api_endpoint: { Host: 'api.example.com' }, user: { name: 'u' } } as unknown as EndpointModel;

    async function reconnect(result: ActionState) {
      const base = await setup();
      base.endpoint.set(connectedEndpoint);
      const connect = vi.fn(async () => result);
      Object.assign(base.data, { endpoints: signal(new Map()), connect });
      const service = new ConnectEndpointService(endpointsService, config, base.data, base.injector);
      const connected = vi.fn();
      const sub = service.hasConnected$.subscribe(connected);
      await base.fixture.whenStable();

      vi.useFakeTimers();
      try {
        service.setData({ authType: 'creds', authVal: { username: 'u', password: 'wrong' }, systemShared: false, bodyContent: '' });
        const submitted = await firstValueFrom(service.submit());
        // The endpoint list is refreshed meanwhile (here: a new object for
        // the same, still connected endpoint).
        base.endpoint.set({ ...connectedEndpoint });
        TestBed.tick();
        await vi.advanceTimersByTimeAsync(3000);
        return { submitted, connected };
      } finally {
        vi.useRealTimers();
        sub.unsubscribe();
        service.destroy();
      }
    }

    it('does not report a failed reconnect as connected', async () => {
      const { submitted, connected } = await reconnect({ busy: false, error: true, message: 'Unauthorized' });
      expect(submitted.success).toBe(false);
      expect(connected).not.toHaveBeenCalled();
    });

    it('reports a reconnect that succeeds, once', async () => {
      const { submitted, connected } = await reconnect({ busy: false, error: false, message: '' });
      expect(submitted.success).toBe(true);
      expect(connected).toHaveBeenCalledTimes(1);
    });
  });
});
