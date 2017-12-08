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

const initialState = getInitialTestStoreState();

const appId = '1';
const cfId = '2';

const applicationServiceFactory = (
  store: Store<AppState>,
  entityService: EntityService,
  applicationStateService: ApplicationStateService,
  applicationEnvVarsService: ApplicationEnvVarsService
) => {
  const appService = new ApplicationService(
    store,
    entityService,
    applicationStateService,
    applicationEnvVarsService
  );
  const cfGuid = Object.keys(initialState.requestData[cnsisStoreNames.section][cnsisStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.cf.application)[0];
  appService.setApplication(cfGuid, appGuid);
  return appService;
};

describe('CfAppEventsConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppEventsConfigService,
        generateTestEntityServiceProvider(
          appId,
          ApplicationSchema,
          new GetApplication(appId, cfId)
        ),
        {
          provide: ApplicationService,
          useFactory: applicationServiceFactory,
          deps: [
            Store,
            EntityService,
            ApplicationStateService,
            ApplicationEnvVarsService
          ]
        }
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
