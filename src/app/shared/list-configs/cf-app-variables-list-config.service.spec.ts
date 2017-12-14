import { generateTestApplicationServiceProvider } from '../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../test-framework/entity-service.helper';
import { cnsisStoreNames } from '../../store/types/cnsis.types';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { ApplicationsModule } from '../../features/applications/applications.module';


import { ApplicationService } from '../../features/applications/application.service';
import { EntityService } from '../../core/entity-service';
import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { Store, StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../shared.module';
 
import { TestBed, inject } from '@angular/core/testing';

import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';
import { ApplicationStateService } from '../../features/applications/application/build-tab/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../../features/applications/application/build-tab/application-env-vars.service';

const initialState = getInitialTestStoreState();

const cfGuid = Object.keys(initialState.requestData[cnsisStoreNames.section][cnsisStoreNames.type])[0];
const appGuid = Object.keys(initialState.requestData.cf.application)[0];

describe('CfAppVariablesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppVariablesListConfigService,
        generateTestEntityServiceProvider(
          appGuid,
          ApplicationSchema,
          new GetApplication(appGuid, cfGuid)
        ),
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        ApplicationsModule
      ]
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }));
});
