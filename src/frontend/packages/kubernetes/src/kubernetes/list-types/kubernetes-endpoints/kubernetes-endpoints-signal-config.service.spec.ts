import { ApplicationRef, Injectable, Signal, WritableSignal, computed, signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

// Effects don't flush synchronously under provideZonelessChangeDetection;
// poke ApplicationRef.tick() so the nameFilter -> filter predicate effect
// runs before assertions read pagedItems().
function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

import { EndpointsSignalService } from '@stratosui/core';
import type { EndpointModel, IRequestEntityTypeState } from '@stratosui/store';

import { KubernetesEndpointsSignalConfigService } from './kubernetes-endpoints-signal-config.service';

// Tiny stub for EndpointsSignalService — the only collaborator the
// signal-config service consumes. Exposing the writable backing signal
// lets each spec push a fresh entity-state in without re-providing the
// stub. Other accessors on EndpointsSignalService aren't read by the
// service under test, so they're declared with empty signals to
// satisfy the type rather than mocked.
@Injectable()
class EndpointsSignalStub {
  readonly _endpoints: WritableSignal<IRequestEntityTypeState<EndpointModel>> =
    signal({} as IRequestEntityTypeState<EndpointModel>);
  readonly endpoints: Signal<IRequestEntityTypeState<EndpointModel>> =
    computed(() => this._endpoints());
  readonly haveRegistered = computed(() => Object.keys(this._endpoints()).length > 0);
  readonly connectedEndpoints = computed(() => Object.values(this._endpoints()) as EndpointModel[]);
  readonly haveConnected = computed(() => this.connectedEndpoints().length > 0);
  readonly disablePersistenceFeatures = computed(() => false);
}

function k8sEndpoint(guid: string, name: string, status: string = 'connected'): EndpointModel {
  return {
    guid,
    name,
    cnsi_type: 'k8s',
    connectionStatus: status,
    api_endpoint: { Host: `${name}.example`, Path: '', Scheme: 'https' },
  } as unknown as EndpointModel;
}

function cfEndpoint(guid: string, name: string): EndpointModel {
  return {
    guid,
    name,
    cnsi_type: 'cf',
    connectionStatus: 'connected',
    api_endpoint: { Host: `${name}.cf.example`, Path: '', Scheme: 'https' },
  } as unknown as EndpointModel;
}

describe('KubernetesEndpointsSignalConfigService', () => {
  let svc: KubernetesEndpointsSignalConfigService;
  let endpointsStub: EndpointsSignalStub;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EndpointsSignalStub,
        { provide: EndpointsSignalService, useExisting: EndpointsSignalStub },
        KubernetesEndpointsSignalConfigService,
      ],
    });
    endpointsStub = TestBed.inject(EndpointsSignalStub);
    svc = TestBed.inject(KubernetesEndpointsSignalConfigService);
  });

  it('does not initialize the view until config is read', () => {
    expect(svc.view).toBeUndefined();
  });

  it('exposes a SignalListConfig with card as the default view mode', () => {
    const cfg = svc.config;
    expect(cfg).toBeDefined();
    expect(cfg.viewMode).toBeDefined();
    expect(cfg.viewMode!()).toBe('card');
    expect(svc.view).toBeDefined();
  });

  it('returns a stable config reference across reads', () => {
    const a = svc.config;
    const b = svc.config;
    expect(a).toBe(b);
  });

  it('filters the endpoints projection to k8s + connected entries', () => {
    endpointsStub._endpoints.set({
      a: k8sEndpoint('a', 'kube-a'),
      b: k8sEndpoint('b', 'kube-b', 'disconnected'),
      c: cfEndpoint('c', 'cf-1'),
      d: k8sEndpoint('d', 'kube-d'),
    } as unknown as IRequestEntityTypeState<EndpointModel>);

    const cfg = svc.config;
    const items = cfg.pagedItems();
    expect(items.map(e => e.guid).sort()).toEqual(['a', 'd']);
    expect(cfg.totalFilteredResults()).toBe(2);
  });

  it('honours nameFilter as a case-insensitive substring on name', () => {
    endpointsStub._endpoints.set({
      a: k8sEndpoint('a', 'prod-cluster'),
      b: k8sEndpoint('b', 'dev-cluster'),
      c: k8sEndpoint('c', 'lab'),
    } as unknown as IRequestEntityTypeState<EndpointModel>);

    const cfg = svc.config;
    // Read once to materialise the view; the effect fires on the
    // initial nameFilter value (empty) so all rows are visible.
    expect(cfg.pagedItems().length).toBe(3);

    svc.nameFilter.set('CLUSTER');
    flushEffects();
    expect(cfg.pagedItems().map(e => e.guid).sort()).toEqual(['a', 'b']);
  });

  it('clearFilters() resets nameFilter, sort and pageIndex', () => {
    void svc.config; // materialise
    svc.nameFilter.set('foo');
    svc.pageIndex.set(2);
    svc.sort.set({ field: 'address', direction: 'desc' });

    svc.clearFilters();
    expect(svc.nameFilter()).toBe('');
    expect(svc.pageIndex()).toBe(0);
    expect(svc.sort()).toEqual({ field: 'name', direction: 'asc' });
  });

  it('destroy() drops the cached config so a subsequent read rebuilds', () => {
    const a = svc.config;
    svc.destroy();
    const b = svc.config;
    expect(a).not.toBe(b);
  });

  it('sorts by name asc by default; flipping direction reverses order', () => {
    endpointsStub._endpoints.set({
      a: k8sEndpoint('a', 'charlie'),
      b: k8sEndpoint('b', 'alpha'),
      c: k8sEndpoint('c', 'bravo'),
    } as unknown as IRequestEntityTypeState<EndpointModel>);

    const cfg = svc.config;
    expect(cfg.pagedItems().map(e => e.name)).toEqual(['alpha', 'bravo', 'charlie']);

    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(cfg.pagedItems().map(e => e.name)).toEqual(['charlie', 'bravo', 'alpha']);
  });
});
