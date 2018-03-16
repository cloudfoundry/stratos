import { TestBed, inject } from '@angular/core/testing';

import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';

describe('AppServiceBindingListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppServiceBindingListConfigService]
    });
  });

  it('should be created', inject([AppServiceBindingListConfigService], (service: AppServiceBindingListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
