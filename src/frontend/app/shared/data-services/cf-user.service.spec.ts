import { TestBed, inject } from '@angular/core/testing';

import { CfUserService } from './cf-user.service';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfUserService]
    });
  });

  it('should be created', inject([CfUserService], (service: CfUserService) => {
    expect(service).toBeTruthy();
  }));
});
