import { TestBed, inject } from '@angular/core/testing';

import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('AppServiceBindingListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppServiceBindingListConfigService],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([AppServiceBindingListConfigService], (service: AppServiceBindingListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
