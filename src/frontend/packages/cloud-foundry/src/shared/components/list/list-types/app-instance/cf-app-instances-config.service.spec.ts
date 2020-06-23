import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { testSCFEndpointGuid } from '@stratosui/store/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { CF_GUID } from '../../../../../../../core/src/shared/entity.tokens';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestEntityServiceProvider } from '../../../../../../../core/test-framework/entity-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { GetApplication } from '../../../../../actions/application.actions';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { applicationEntityType } from '../../../../../cf-entity-types';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { CfAppInstancesConfigService } from './cf-app-instances-config.service';

describe('CfAppInstancesConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';

    TestBed.configureTestingModule({
      providers: [
        CfAppInstancesConfigService,
        generateTestEntityServiceProvider(
          appGuid,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appGuid, cfGuid)
        ),
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
        CoreModule,
        SharedModule,
        ApplicationsModule,
        RouterTestingModule,
      ]
    });
  });

  it('should be created', inject([CfAppInstancesConfigService], (service: CfAppInstancesConfigService) => {
    expect(service).toBeTruthy();
  }));
});
