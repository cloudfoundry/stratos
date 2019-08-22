import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { CustomImportModule } from '../../../../../../../core/src/custom-import.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from '../../../../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../../core/test-framework/entity-service.helper';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { GetApplication } from '../../../../../actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../../cf-entity-factory';
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
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        generateCfStoreModules(),
        CommonModule,
        CoreModule,
        SharedModule,
        ApplicationsModule,
        RouterTestingModule,
      ]
    }).overrideModule(ApplicationsModule, {
      remove: {
        imports: [CustomImportModule]
      }
    });
  });

  it('should be created', inject([CfAppInstancesConfigService], (service: CfAppInstancesConfigService) => {
    expect(service).toBeTruthy();
  }));
});
