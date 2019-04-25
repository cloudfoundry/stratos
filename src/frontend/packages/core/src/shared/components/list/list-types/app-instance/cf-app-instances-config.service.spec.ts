import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/core.module';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../shared.module';
import { CfAppInstancesConfigService } from './cf-app-instances-config.service';
import { endpointStoreNames } from '../../../../../../../store/src/types/endpoint.types';
import { entityFactory, applicationSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { GetApplication } from '../../../../../../../store/src/actions/application.actions';
import { CustomImportModule } from '../../../../../custom-import.module';

describe('CfAppInstancesConfigService', () => {

  const initialState = getInitialTestStoreState();
  const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.application)[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppInstancesConfigService,
        generateTestEntityServiceProvider(
          appGuid,
          entityFactory(applicationSchemaKey),
          new GetApplication(appGuid, cfGuid)
        ),
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        ApplicationsModule,
        createBasicStoreModule(),
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
