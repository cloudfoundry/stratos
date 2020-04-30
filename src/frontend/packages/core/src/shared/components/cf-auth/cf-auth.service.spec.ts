import { inject, TestBed } from '@angular/core/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CfAuthService } from './cf-auth.service';

describe('CfAuthService', () => {
  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [CfAuthService],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([CfAuthService], (service: CfAuthService) => {
    expect(service).toBeTruthy();
  }));
});
