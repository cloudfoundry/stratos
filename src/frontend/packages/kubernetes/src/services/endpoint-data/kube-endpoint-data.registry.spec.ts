import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';

describe('KubeEndpointDataRegistry', () => {
  let registry: KubeEndpointDataRegistry;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
      ],
    });
    registry = TestBed.inject(KubeEndpointDataRegistry);
  });

  it('returns the same service instance on repeated acquire() for same kubeGuid', () => {
    const a1 = registry.acquire('kube-a');
    const a2 = registry.acquire('kube-a');
    expect(a1).toBe(a2);
  });

  it('getService is an alias for acquire and returns the cached instance', () => {
    const a1 = registry.acquire('kube-a');
    const a2 = registry.getService('kube-a');
    expect(a1).toBe(a2);
  });

  it('vends distinct instances per kubeGuid', () => {
    const a = registry.acquire('kube-a');
    const b = registry.acquire('kube-b');
    expect(a).not.toBe(b);
    expect(a.kubeGuid).toBe('kube-a');
    expect(b.kubeGuid).toBe('kube-b');
  });

  it('keeps the instance after release (sticky cache)', () => {
    const a = registry.acquire('kube-a');
    registry.release('kube-a');
    const aAgain = registry.acquire('kube-a');
    expect(a).toBe(aAgain);
  });

  it('unregister evicts the cached instance so the next acquire builds fresh', () => {
    const a = registry.acquire('kube-a');
    registry.unregister('kube-a');
    const aAfter = registry.acquire('kube-a');
    expect(a).not.toBe(aAfter);
  });

  it('snapshot reports per-instance counters and metadata', () => {
    registry.acquire('kube-a');
    registry.acquire('kube-a');
    registry.acquire('kube-b');
    const snap = registry.getSnapshot();
    expect(snap.acquireCalls).toBe(3);
    expect(snap.acquireExistingHits).toBe(1);
    expect(snap.newInstances).toBe(2);
    expect(snap.instances).toHaveLength(2);
    const a = snap.instances.find(i => i.kubeGuid === 'kube-a');
    expect(a?.refCount).toBe(2);
    expect(a?.namespaceCount).toBe(0);
  });
});
