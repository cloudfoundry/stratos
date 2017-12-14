import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../core/core.module';
import { ApplicationsModule } from '../../features/applications/applications.module';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { cnsisStoreNames } from '../../store/types/cnsis.types';
import { generateTestApplicationServiceProvider } from '../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { SharedModule } from '../shared.module';
import { CfAppEventsConfigService } from './cf-app-events-config.service';

const initialState = getInitialTestStoreState();

const cfGuid = Object.keys(initialState.requestData[cnsisStoreNames.section][cnsisStoreNames.type])[0];
const appGuid = Object.keys(initialState.requestData.cf.application)[0];

describe('CfAppEventsConfigService', () => {
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
