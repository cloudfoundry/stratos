import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CfStacksListConfigService } from './cf-stacks-list-config.service';

describe('CfStacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfStacksListConfigService, ActiveRouteCfOrgSpace],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CfStacksListConfigService], (service: CfStacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
