import { inject, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../core/src/shared/shared.module';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from './cf-user.service';
import { HttpClientModule } from '@angular/common/http';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        HttpClientModule
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
