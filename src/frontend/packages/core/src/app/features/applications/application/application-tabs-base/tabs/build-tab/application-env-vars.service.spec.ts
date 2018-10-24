import { inject, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';

describe('ApplicationEnvVarsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationEnvVarsHelper,
        PaginationMonitorFactory,
      ],
      imports: [
        createBasicStoreModule()
      ]
    });
  });

  it('should be created', inject([ApplicationEnvVarsHelper], (service: ApplicationEnvVarsHelper) => {
    expect(service).toBeTruthy();
  }));
});
