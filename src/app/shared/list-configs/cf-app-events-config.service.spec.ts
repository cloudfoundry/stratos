import { generateTestApplicationServiceProvider } from '../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../test-framework/entity-service.helper';
import { cnsisStoreNames } from '../../store/types/cnsis.types';
import { ApplicationsModule } from '../../features/applications/applications.module';

import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { EntityService } from '../../core/entity-service';
import { ApplicationService } from '../../features/applications/application.service';
import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { Store, StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../shared.module';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { TestBed, inject } from '@angular/core/testing';

import { CfAppEventsConfigService } from './cf-app-events-config.service';
import { ApplicationStateService } from '../../features/applications/application/build-tab/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../../features/applications/application/build-tab/application-env-vars.service';



describe('CfAppEventsConfigService', () => {
  const initialState = getInitialTestStoreState();

  const cfGuid = Object.keys(initialState.requestData[cnsisStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.application)[0];
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppEventsConfigService,
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
        ApplicationsModule,
        createBasicStoreModule()
      ]
    });
  });

  it('should be created', inject([CfAppEventsConfigService], (service: CfAppEventsConfigService) => {
    expect(service).toBeTruthy();
  }));
});
