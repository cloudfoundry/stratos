import { TestBed, inject } from '@angular/core/testing';

import { KubernetesNamespaceService } from './kubernetes-namespace.service';

describe('KubernetesNamespaceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KubernetesNamespaceService]
    });
  });

  it('should be created', inject([KubernetesNamespaceService], (service: KubernetesNamespaceService) => {
    expect(service).toBeTruthy();
  }));
});
