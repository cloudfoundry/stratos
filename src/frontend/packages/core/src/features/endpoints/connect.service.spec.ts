import { ChangeDetectionStrategy, Component, computed, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionState, EndpointFetchingState, EndpointModel, EndpointsDataService } from '@stratosui/store';
import { firstValueFrom, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EndpointsService } from '../../core/endpoints.service';
import { TailwindSnackBarRef, TailwindSnackBarService } from '../../shared/services/tailwind-snackbar.service';
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

  // TLS options are set on Register, not here: a connect makes one request
  // and never saves the endpoint.
  it('connects with one request and does not update the endpoint', async () => {
    const { injector, data } = await setup();
    const stored = { guid: 'ep-1', name: 'ep', cnsi_type: 'cf', sso_allowed: true, skip_ssl_validation: false, ca_cert: '' } as EndpointModel;
    const update = vi.fn();
    const connect = vi.fn(async () => ({ busy: false, error: false, message: '' }));
    Object.assign(data, { endpoints: signal(new Map([['ep-1', stored]])), update, connect });
    const service = new ConnectEndpointService(endpointsService, config, data, injector);
    service.setData({ authType: 'creds', authVal: { username: 'u', password: 'p' }, systemShared: false, bodyContent: '' });

    const result = await firstValueFrom(service.submit());

    expect(result).toEqual({ success: true, errorMessage: '' });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    service.destroy();
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

    async function reconnect(result: ActionState & { alsoConnected?: { guid: string, name: string }[] }) {
      const base = await setup();
      base.endpoint.set(connectedEndpoint);
      const connect = vi.fn(async () => result);
      const disconnect = vi.fn(async () => ({ busy: false, error: false, message: '' }));
      Object.assign(base.data, { endpoints: signal(new Map()), connect, disconnect });
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
        return { submitted, connected, disconnect };
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

    describe('with other connections at the same address', () => {
      function watchSnackbars() {
        const action = new Subject<void>();
        const ref = { onAction: () => action, afterDismissed: () => new Subject() } as unknown as TailwindSnackBarRef<unknown>;
        const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show').mockReturnValue(ref);
        return { show, action };
      }

      it('reports the connect, names them and offers to disconnect them', async () => {
        const { show } = watchSnackbars();
        const { connected } = await reconnect({ busy: false, error: false, message: '', alsoConnected: [{ guid: 'ep-2', name: 'norm-lab' }] });
        expect(show).toHaveBeenCalledTimes(1);
        expect(show).toHaveBeenCalledWith(
          "Connected to 'ep'. You are also connected to this address through 'norm-lab'. Dismiss to keep all connected.",
          'Disconnect others');
        // The dialog need not say "Connected endpoint" as well.
        expect(connected).toHaveBeenCalledWith(true);
      });

      it('disconnects them only when asked', async () => {
        const { action } = watchSnackbars();
        const { disconnect } = await reconnect({
          busy: false, error: false, message: '',
          alsoConnected: [{ guid: 'ep-2', name: 'norm-lab' }, { guid: 'ep-3', name: 'mine' }],
        });
        expect(disconnect).not.toHaveBeenCalled();
        action.next();
        expect(disconnect.mock.calls).toEqual([['ep-2'], ['ep-3']]);
      });

      it('says nothing, and leaves the report to the dialog, when none is listed', async () => {
        const { show } = watchSnackbars();
        const { connected } = await reconnect({ busy: false, error: false, message: '' });
        expect(show).not.toHaveBeenCalled();
        expect(connected).toHaveBeenCalledWith(false);
      });
    });
  });
});
