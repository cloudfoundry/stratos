import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/core.module';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { GetApplication } from '../../../../../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../shared.module';
import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';


describe('CfAppVariablesListConfigService', () => {

  const initialState = getInitialTestStoreState();
  const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.application)[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppVariablesListConfigService,
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
        createBasicStoreModule(),
        ApplicationsModule,
        RouterTestingModule
      ]
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }));
});
