import { TestBed, inject } from '@angular/core/testing';

import { CfStacksListConfigService } from './cf-stacks-list-config.service';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';
import { getBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
describe('CfStacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfStacksListConfigService, BaseCF],
      imports: [...getBaseTestModules]
    });
  });

  it('should be created', inject([CfStacksListConfigService], (service: CfStacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
