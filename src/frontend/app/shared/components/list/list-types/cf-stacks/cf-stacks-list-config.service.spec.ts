import { TestBed, inject } from '@angular/core/testing';

import { CfStacksListConfigService } from './cf-stacks-list-config.service';

describe('CfStacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfStacksListConfigService]
    });
  });

  it('should be created', inject([CfStacksListConfigService], (service: CfStacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
