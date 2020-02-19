import { CommonModule } from '@angular/common';
import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GetApplication } from '../../../../../cloud-foundry/src/actions/application.actions';
import { cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { applicationEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { ApplicationsModule } from '../../../../../cloud-foundry/src/features/applications/applications.module';
import { CoreModule } from '../../../../../core/src/core/core.module';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from '../../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../core/test-framework/entity-service.helper';
import { createEmptyStoreModule } from '@stratos/store/testing';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { CfAppAutoscalerEventsConfigService } from './cf-app-autoscaler-events-config.service';

describe('CfAppAutoscalerEventsConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpBackend, useClass: HttpTestingController },
        CfAppAutoscalerEventsConfigService,
        EntityServiceFactory,
        generateTestEntityServiceProvider(
          appGuid,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appGuid, cfGuid)
        ),
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        HttpClient,
      ],
      imports: [
        HttpClientModule,
        CfAutoscalerTestingModule,
        CommonModule,
        CoreModule,
        SharedModule,
        ApplicationsModule,
        createEmptyStoreModule(),
        RouterTestingModule,
      ]
    });
  });

  it('should be created', inject([CfAppAutoscalerEventsConfigService], (service: CfAppAutoscalerEventsConfigService) => {
    expect(service).toBeTruthy();
  }));

  afterAll(() => { });
});
