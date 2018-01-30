import { TestBed, inject } from '@angular/core/testing';

import { CfAuthService } from './cf-auth.service';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

describe('CfAuthService', () => {
  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [CfAuthService],
      imports: [
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([CfAuthService], (service: CfAuthService) => {
    expect(service).toBeTruthy();
  }));
});
