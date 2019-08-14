import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsListConfigService } from './detach-apps-list-config.service';

describe('DetachAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetachAppsListConfigService, DatePipe],
      imports: [generateCfBaseTestModules()],
    });
  });

  it('should be created', inject([DetachAppsListConfigService], (service: DetachAppsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
