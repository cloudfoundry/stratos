import { CommonModule } from '@angular/common';
import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratosui/store/testing';

import { ApplicationsModule } from '../../../../../cloud-foundry/src/features/applications/applications.module';
import {
  generateTestApplicationServiceProvider,
} from '../../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { EntityCatalogHelper } from '../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
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
        EntityMonitorFactory,
        EntityCatalogHelper,
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
        AppTestModule
      ]
    });
  });

  it('should be created', inject([CfAppAutoscalerEventsConfigService], (service: CfAppAutoscalerEventsConfigService) => {
    expect(service).toBeTruthy();
  }));

  afterAll(() => { });
});
