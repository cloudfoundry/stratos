import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceRoutesListConfigService } from './cf-space-routes-list-config.service';

describe('CfSpaceRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceRoutesListConfigService]
    });
  });

  it('should be created', inject([CfSpaceRoutesListConfigService], (service: CfSpaceRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
