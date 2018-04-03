import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceAppsListConfigService } from './cf-space-apps-list-config.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DatePipe } from '@angular/common';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CloudFoundrySpaceServiceMock } from '../../../../../test-framework/cloud-foundry-space.service.mock';

describe('CfSpaceAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSpaceAppsListConfigService,
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CfSpaceAppsListConfigService], (service: CfSpaceAppsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
