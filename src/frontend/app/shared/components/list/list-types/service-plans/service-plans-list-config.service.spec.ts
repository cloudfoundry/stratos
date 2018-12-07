import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ServicePlansListConfigService } from './service-plans-list-config.service';

describe('ServicePlansListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicePlansListConfigService,
      ],
      imports: [
        BaseTestModules,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([ServicePlansListConfigService], (service: ServicePlansListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
