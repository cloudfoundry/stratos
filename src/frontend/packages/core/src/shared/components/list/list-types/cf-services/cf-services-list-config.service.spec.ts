import { TestBed, inject } from '@angular/core/testing';

import { CfServicesListConfigService } from './cf-services-list-config.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

describe('CfServicesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfServicesListConfigService, ActiveRouteCfOrgSpace],
      imports: [...BaseTestModules],
    });
  });

  it('should be created', inject([CfServicesListConfigService], (service: CfServicesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
