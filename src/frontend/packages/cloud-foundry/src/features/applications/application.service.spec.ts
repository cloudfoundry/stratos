import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ExtensionService } from '../../../../core/src/core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../git/src/shared/scm/scm.service';
import {
  AppStoreModule,
  EntityMonitorFactory,
  EntityServiceFactory,
  PaginationMonitorFactory
} from '@stratosui/store';
import { generateTestApplicationServiceProvider } from '@test-framework/application-service-helper';
import { generateCfStoreModules } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../shared/data-services/long-running-cf-op.service';
import { ApplicationStateService } from '../../shared/services/application-state.service';
import { ApplicationService } from './application.service';
import { ApplicationEnvVarsHelper } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';

describe('ApplicationService', () => {

  const appId = '1';
  const cfId = '2';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        AppStoreModule,
        RouterTestingModule,
        generateCfStoreModules(),
      ],
      providers: [
        EntityServiceFactory,
        
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        ExtensionService,
        LongRunningCfOperationsService,

        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ApplicationService);
    expect(service).toBeTruthy();
  });
});
