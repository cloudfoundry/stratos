import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfOrgSpaceDataService, ServiceActionHelperService } from '@stratosui/cloud-foundry';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { ServiceInstancesWallListConfigService } from './service-instances-wall-list-config.service';

describe('ServiceInstancesWallListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        ServiceInstancesWallListConfigService,
        CfOrgSpaceDataService,
        DatePipe,
        ServiceActionHelperService,
        CurrentUserPermissionsService,
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceInstancesWallListConfigService);
    expect(service).toBeTruthy();
  });
});
