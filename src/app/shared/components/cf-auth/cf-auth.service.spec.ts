import { TestBed, inject } from '@angular/core/testing';

import { CfAuthService } from './cf-auth.service';

describe('CfAuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAuthService]
    });
  });

  it('should be created', inject([CfAuthService], (service: CfAuthService) => {
    expect(service).toBeTruthy();
  }));
});
