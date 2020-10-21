import { inject, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';

describe('ApplicationEnvVarsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationEnvVarsHelper,
        PaginationMonitorFactory,
      ],
      imports: [
        generateCfStoreModules()
      ]
    });
  });

  it('should be created', inject([ApplicationEnvVarsHelper], (service: ApplicationEnvVarsHelper) => {
    expect(service).toBeTruthy();
  }));
});
