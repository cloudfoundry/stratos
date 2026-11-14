import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { KubernetesNamespaceService } from './kubernetes-namespace.service';

describe('KubernetesNamespaceService', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const namespaceDataStub = { refresh };

  let svc: KubernetesNamespaceService;

  beforeEach(() => {
    vi.clearAllMocks();
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
});
