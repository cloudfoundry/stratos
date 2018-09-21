import { TestBed } from '@angular/core/testing';

import { HelmReleaseService } from './helm-release.service';

describe('HelmReleaseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HelmReleaseService = TestBed.get(HelmReleaseService);
    expect(service).toBeTruthy();
  });
});
