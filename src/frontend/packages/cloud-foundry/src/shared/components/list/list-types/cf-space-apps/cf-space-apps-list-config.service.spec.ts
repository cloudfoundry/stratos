import { DatePipe } from '@angular/common';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, CloudFoundrySpaceServiceMock } from '@test-framework/cf';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfSpaceAppsListConfigService } from "./cf-space-apps-list-config.service";

describe('CfSpaceAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfSpaceAppsListConfigService,
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceAppsListConfigService);
    expect(service).toBeTruthy();
  });
});
