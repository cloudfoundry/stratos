import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { EndpointModel } from '@stratosui/store';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';
import { KubeEndpointRegistryHook } from './kube-endpoint-registry.hook';

type EndpointMap = { [guid: string]: EndpointModel };

function kubeEp(guid: string, status: 'connected' | 'disconnected' | 'checking' = 'connected'): EndpointModel {
  return {
    guid,
    name: guid,
    cnsi_type: KUBERNETES_ENDPOINT_TYPE,
    connectionStatus: status,
  } as unknown as EndpointModel;
}

function cfEp(guid: string, status: 'connected' | 'disconnected' = 'connected'): EndpointModel {
  return {
    guid,
    name: guid,
    cnsi_type: 'cf',
    connectionStatus: status,
  } as unknown as EndpointModel;
}

describe('KubeEndpointRegistryHook', () => {
  let endpoints$: BehaviorSubject<EndpointMap>;
  let registry: KubeEndpointDataRegistry;

  function init(initial: EndpointMap = {}) {
    endpoints$ = new BehaviorSubject<EndpointMap>(initial);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointsService, useValue: { endpoints$ } },
        KubeEndpointDataRegistry,
        KubeEndpointRegistryHook,
      ],
    });
    registry = TestBed.inject(KubeEndpointDataRegistry);
    // Force eager construction so the subscription is live.
    TestBed.inject(KubeEndpointRegistryHook);
  }

  beforeEach(() => {
    // No-op; each test calls init() with its initial state.
  });

  it('warms registry for kubernetes endpoints already connected at subscription time', () => {
    init({ 'kube-a': kubeEp('kube-a') });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');
  });

  it('warms registry on a new connect emission', () => {
    init({});
    expect(registry.getSnapshot().instances).toHaveLength(0);

    endpoints$.next({ 'kube-a': kubeEp('kube-a') });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');
  });

  it('evicts registry entry when connectionStatus flips to disconnected', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    expect(registry.getSnapshot().instances).toHaveLength(1);

    endpoints$.next({ 'kube-a': kubeEp('kube-a', 'disconnected') });

    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('evicts registry entry when endpoint is removed entirely', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    expect(registry.getSnapshot().instances).toHaveLength(1);

    endpoints$.next({});

    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('ignores non-kubernetes endpoints', () => {
    init({ 'cf-a': cfEp('cf-a') });
    expect(registry.getSnapshot().instances).toHaveLength(0);

    endpoints$.next({ 'cf-a': cfEp('cf-a'), 'cf-b': cfEp('cf-b') });
    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('is idempotent on duplicate emissions with the same connected set', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    const before = registry.getSnapshot();
    expect(before.instances).toHaveLength(1);
    const newInstancesBefore = before.newInstances;

    // Re-emit the same map shape — no new instance should be created and
    // no eviction should occur.
    endpoints$.next({ 'kube-a': kubeEp('kube-a') });

    const after = registry.getSnapshot();
    expect(after.instances).toHaveLength(1);
    expect(after.newInstances).toBe(newInstancesBefore);
    expect(after.unregisters).toBe(before.unregisters);
  });

  it('handles mixed kubernetes + non-kubernetes endpoint maps correctly', () => {
    init({
      'kube-a': kubeEp('kube-a'),
      'cf-a': cfEp('cf-a'),
      'kube-b': kubeEp('kube-b', 'disconnected'),
    });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');

    // Connect kube-b, disconnect kube-a — net swap.
    endpoints$.next({
      'kube-a': kubeEp('kube-a', 'disconnected'),
      'cf-a': cfEp('cf-a'),
      'kube-b': kubeEp('kube-b'),
    });

    const after = registry.getSnapshot();
    const guids = after.instances.map(i => i.kubeGuid).sort();
    expect(guids).toEqual(['kube-b']);
  });
});
