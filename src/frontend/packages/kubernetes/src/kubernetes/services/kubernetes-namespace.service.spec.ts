import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { KubernetesNamespaceService } from './kubernetes-namespace.service';

describe('KubernetesNamespaceService', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const nsSig = signal<{ metadata: { name: string }; status?: unknown } | undefined>(undefined);
  const namespaceDataStub = {
    refresh,
    namespaceByName: (_g: string, _n: string) => nsSig as Signal<unknown>,
  };

  let svc: KubernetesNamespaceService;

  beforeEach(() => {
    vi.clearAllMocks();
    nsSig.set({ metadata: { name: 'default' }, status: { phase: 'Active' } });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: KubeNamespaceDataService, useValue: namespaceDataStub },
        { provide: KubernetesEndpointService, useValue: { kubeGuid: 'k1' } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { namespaceName: 'default' } } } },
        KubernetesNamespaceService,
      ],
    });
    svc = TestBed.inject(KubernetesNamespaceService);
  });

  it('refreshes the per-endpoint namespace cache', () => {
    expect(refresh).toHaveBeenCalledWith({ kubeGuid: 'k1' });
  });

  it('projects the namespace by name onto namespace$', async () => {
    const ns = await firstValueFrom(svc.namespace$);
    expect(ns.metadata.name).toBe('default');
  });
});
