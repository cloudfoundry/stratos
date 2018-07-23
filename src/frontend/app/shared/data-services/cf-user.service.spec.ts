import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { generateTestCfEndpointServiceProvider } from '../../../app/test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';
import { CfUserServiceTestProvider } from '../../test-framework/user-service-helper';
import { SharedModule } from '../shared.module';
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
