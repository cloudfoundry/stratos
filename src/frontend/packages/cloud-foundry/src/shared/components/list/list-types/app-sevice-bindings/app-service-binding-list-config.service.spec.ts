import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  ApplicationEnvVarsHelper,
} from '../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../services/application-state.service';
import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';

describe('AppServiceBindingListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        AppServiceBindingListConfigService,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        DatePipe,
        ServiceActionHelperService,
        ApplicationStateService,
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(AppServiceBindingListConfigService);
    expect(service).toBeTruthy();
  });
});
