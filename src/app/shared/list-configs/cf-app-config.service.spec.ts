import { TestBed, inject } from '@angular/core/testing';

import { CfAppConfigService } from './cf-app-config.service';

describe('CfAppConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppConfigService]
    });
  });

  it('should be created', inject([CfAppConfigService], (service: CfAppConfigService) => {
    expect(service).toBeTruthy();
  }));
});
