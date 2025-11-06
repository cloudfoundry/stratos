import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { testSCFEndpointGuid } from '@stratosui/store/testing';

import { CF_GUID } from '../../../../../../../core/src/shared/entity.tokens';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfAppInstancesConfigService } from './cf-app-instances-config.service';

describe('CfAppInstancesConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';

    TestBed.configureTestingModule({
      providers: [
        CfAppInstancesConfigService,
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        generateTestCfEndpointServiceProvider(),
        {
          provide: CF_GUID,
          useValue: testSCFEndpointGuid,
        },
      ],
      imports: [
        generateCfStoreModules(),
        CommonModule,
        SharedModule,
        RouterTestingModule,
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppInstancesConfigService);
    expect(service).toBeTruthy();
  });
});
