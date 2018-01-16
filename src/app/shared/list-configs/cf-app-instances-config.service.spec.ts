import { TestBed, inject } from '@angular/core/testing';

import { CfAppInstancesConfigService } from './cf-app-instances-config.service';

describe('CfAppInstancesConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppInstancesConfigService]
    });
  });

  it('should be created', inject([CfAppInstancesConfigService], (service: CfAppInstancesConfigService) => {
    expect(service).toBeTruthy();
  }));
});
