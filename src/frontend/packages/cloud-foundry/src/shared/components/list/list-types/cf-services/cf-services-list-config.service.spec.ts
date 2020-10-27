import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfServicesListConfigService } from './cf-services-list-config.service';

describe('CfServicesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfServicesListConfigService, ActiveRouteCfOrgSpace],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', inject([CfServicesListConfigService], (service: CfServicesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
