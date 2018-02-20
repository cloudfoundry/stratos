import { TestBed, inject } from '@angular/core/testing';

import { CfUserListConfigService } from './cf-user-list-config.service';

describe('CfUserListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfUserListConfigService]
    });
  });

  it('should be created', inject([CfUserListConfigService], (service: CfUserListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
