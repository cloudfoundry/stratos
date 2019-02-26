import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/core.module';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { GetApplication } from '../../../../../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../shared.module';
import { CfAppAutoscalerEventsConfigService } from './cf-app-autoscaler-events-config.service';



describe('CfAppAutoscalerEventsConfigService', () => {
  const initialState = getInitialTestStoreState();

  const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.application)[0];
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppAutoscalerEventsConfigService,
        EntityServiceFactory,
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
        RouterTestingModule
      ]
    });
  });

  it('should be created', inject([CfAppAutoscalerEventsConfigService], (service: CfAppAutoscalerEventsConfigService) => {
    expect(service).toBeTruthy();
  }));
});
