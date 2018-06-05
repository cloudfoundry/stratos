import { TestBed, inject } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsListConfigService } from './detach-apps-list-config.service';
import { DatePipe } from '@angular/common';

describe('DetachAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetachAppsListConfigService, DatePipe],
      imports: [BaseTestModules],
    });
  });

  it('should be created', inject([DetachAppsListConfigService], (service: DetachAppsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
