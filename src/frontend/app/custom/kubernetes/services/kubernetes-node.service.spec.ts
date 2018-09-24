import { TestBed } from '@angular/core/testing';

import { KubernetesNodeService } from './kubernetes-node.service';

describe('KubernetesNodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KubernetesNodeService = TestBed.get(KubernetesNodeService);
    expect(service).toBeTruthy();
  });
});
