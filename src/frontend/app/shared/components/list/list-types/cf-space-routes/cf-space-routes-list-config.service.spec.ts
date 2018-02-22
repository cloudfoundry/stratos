import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceRoutesListConfigService } from './cf-space-routes-list-config.service';
import { getBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CfSpaceRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceRoutesListConfigService],
      imports: [...getBaseTestModules]
    });
  });

  it('should be created', inject([CfSpaceRoutesListConfigService], (service: CfSpaceRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
