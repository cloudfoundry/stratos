import { TestBed, inject } from '@angular/core/testing';

import { CfAppRoutesListConfigService } from './cf-app-routes-list-config.service';

describe('CfAppRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppRoutesListConfigService]
    });
  });

  it('should be created', inject([CfAppRoutesListConfigService], (service: CfAppRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
