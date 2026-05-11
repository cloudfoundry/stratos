import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  EndpointActionComplete,
} from '@stratosui/store';

import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';
import { KubeEndpointLifecycleService } from './kube-endpoint-lifecycle.service';

describe('KubeEndpointLifecycleService', () => {
  let actions$: ReplaySubject<unknown>;
  let registry: KubeEndpointDataRegistry;

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockActions(() => actions$),
        KubeEndpointDataRegistry,
        KubeEndpointLifecycleService,
      ],
    });
    registry = TestBed.inject(KubeEndpointDataRegistry);
    // Force the lifecycle service to instantiate (subscribes to Actions).
    TestBed.inject(KubeEndpointLifecycleService);
  });

  it('warms the registry on CONNECT_ENDPOINTS_SUCCESS for a kubernetes endpoint', () => {
    const before = registry.getSnapshot();
    expect(before.instances).toHaveLength(0);

    actions$.next(new EndpointActionComplete(
      CONNECT_ENDPOINTS_SUCCESS,
      'kube-a',
      KUBERNETES_ENDPOINT_TYPE,
      { guid: 'kube-a', name: 'kube-a' } as any,
    ));

    const after = registry.getSnapshot();
    expect(after.instances).toHaveLength(1);
    expect(after.instances[0].kubeGuid).toBe('kube-a');
  });

  it('ignores connect for non-kubernetes endpoints', () => {
    actions$.next(new EndpointActionComplete(
      CONNECT_ENDPOINTS_SUCCESS,
      'cf-a',
      'cf' as any,
      { guid: 'cf-a', name: 'cf-a' } as any,
    ));
    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('evicts the registry entry on DISCONNECT_ENDPOINTS_SUCCESS', () => {
    registry.acquire('kube-a');
    expect(registry.getSnapshot().instances).toHaveLength(1);

    actions$.next(new EndpointActionComplete(
      DISCONNECT_ENDPOINTS_SUCCESS,
      'kube-a',
      KUBERNETES_ENDPOINT_TYPE,
      { guid: 'kube-a', name: 'kube-a' } as any,
    ));

    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('ignores disconnect for non-kubernetes endpoints', () => {
    registry.acquire('kube-a');
    actions$.next(new EndpointActionComplete(
      DISCONNECT_ENDPOINTS_SUCCESS,
      'kube-a',
      'cf' as any,
      { guid: 'kube-a', name: 'kube-a' } as any,
    ));
    expect(registry.getSnapshot().instances).toHaveLength(1);
  });
});
