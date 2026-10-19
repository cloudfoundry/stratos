import { ChangeDetectionStrategy, Component, computed, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionState, EndpointFetchingState, EndpointModel, EndpointsDataService } from '@stratosui/store';
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
});
