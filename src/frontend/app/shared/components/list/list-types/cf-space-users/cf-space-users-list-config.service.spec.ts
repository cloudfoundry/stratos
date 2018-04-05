import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceUsersListConfigService } from './cf-space-users-list-config.service';

describe('CfSpaceUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceUsersListConfigService]
    });
  });

  it('should be created', inject([CfSpaceUsersListConfigService], (service: CfSpaceUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
