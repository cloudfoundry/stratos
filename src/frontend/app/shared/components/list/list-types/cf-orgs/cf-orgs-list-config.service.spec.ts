import { TestBed, inject } from '@angular/core/testing';

import { CfOrgsListConfigService } from './cf-orgs-list-config.service';

describe('CfOrgsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgsListConfigService]
    });
  });

  it('should be created', inject([CfOrgsListConfigService], (service: CfOrgsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
