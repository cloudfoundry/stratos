import { DatePipe } from '@angular/common';
import { HttpBackend, HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from "@stratosui/store/testing";

import {
  generateTestApplicationServiceProvider,
} from '@test-framework/cf';
import { AppTestModule } from '@test-framework';
import { EntityCatalogHelper } from '@stratosui/store';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { CfAppAutoscalerEventsConfigService } from './cf-app-autoscaler-events-config.service';

describe('CfAppAutoscalerEventsConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';

    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: HttpBackend, useClass: HttpTestingController },
        CfAppAutoscalerEventsConfigService,
        EntityCatalogHelper,
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        HttpClient,
        DatePipe,

        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ],
      imports: [
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
        AppTestModule,
      ]
    });
  });

  it('should be created', inject([CfAppAutoscalerEventsConfigService], (service: CfAppAutoscalerEventsConfigService) => {
    expect(service).toBeTruthy();
  }));

  afterAll(() => { });
});
