import { TestBed, inject } from '@angular/core/testing';

import { CfUserService } from './cf-user.service';
import {
  getBaseTestModules,
} from '../../../app/test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfUserService],
      imports: [...getBaseTestModules],
    });
  });

  it('should be created', inject([CfUserService], (service: CfUserService) => {
    expect(service).toBeTruthy();
  }));
});
