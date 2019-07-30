import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CfServicesListConfigService } from './cf-services-list-config.service';

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
