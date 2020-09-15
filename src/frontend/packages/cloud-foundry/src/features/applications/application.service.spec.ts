import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ExtensionService } from '../../../../core/src/core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../core/src/core/github.helpers';
import { EntityMonitorFactory } from '../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { AppStoreModule } from '../../../../store/src/store.module';
import { generateTestApplicationServiceProvider } from '../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../shared/data-services/long-running-cf-op.service';
import { GitSCMService } from '../../shared/data-services/scm/scm.service';
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
        generateCfStoreModules()
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        ExtensionService,
        LongRunningCfOperationsService
      ]
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
