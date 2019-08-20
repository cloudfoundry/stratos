import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { SharedModule } from '../../../../core/src/shared/shared.module';
import {
  generateTestCfEndpointServiceProvider,
} from '../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../core/test-framework/store-test-helper';
import { CfUserService } from './cf-user.service';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        createBasicStoreModule(),
        HttpModule
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider()
        ]
    });
  });

  it('should be created', inject([CfUserService], (service: CfUserService) => {
    expect(service).toBeTruthy();
  }));
});
