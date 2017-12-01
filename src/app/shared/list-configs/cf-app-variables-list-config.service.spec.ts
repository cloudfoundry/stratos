import { TestBed, inject } from '@angular/core/testing';

import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';

describe('CfAppVariablesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppVariablesListConfigService]
    });
  });

  it('should be created', inject([CfAppVariablesListConfigService], (service: CfAppVariablesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
