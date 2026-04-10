import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import {ServiceActionHelperService,
  cfCurrentUserPermissionsService} from '@stratosui/cloud-foundry';
import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';

import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';

describe('AppServiceBindingListConfigService', () => {
  beforeEach(() => {
    const cfGuid = 'test-cf-guid';
    const appGuid = 'test-app-guid';

    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
      ],
      providers: [
        AppServiceBindingListConfigService,
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        ServiceActionHelperService,
        ...cfCurrentUserPermissionsService,
        DatePipe,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(AppServiceBindingListConfigService);
    expect(service).toBeTruthy();
  });
});
