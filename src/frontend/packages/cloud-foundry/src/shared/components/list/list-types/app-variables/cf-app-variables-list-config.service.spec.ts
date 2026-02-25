import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ConfirmationDialogService } from '@stratosui/core';
import { generateTestApplicationServiceProvider, ApplicationStateService, ApplicationEnvVarsHelper, generateCfStoreModules } from '@test-framework/cf';
import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';

describe('CfAppVariablesListConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';
    TestBed.configureTestingModule({
      providers: [
        CfAppVariablesListConfigService,
        ConfirmationDialogService,
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        ...generateCfStoreModules(),
      ]
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }
  ));
});
