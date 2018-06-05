import { TestBed, inject } from '@angular/core/testing';

import { DetachAppsListConfigService } from './detach-apps-list-config.service';

describe('DetachAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetachAppsListConfigService]
    });
  });

  it('should be created', inject([DetachAppsListConfigService], (service: DetachAppsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
