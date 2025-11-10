import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationServiceMock, generateCfBaseTestModules } from '@test-framework/cf';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppInstancesConfigService } from './cf-app-instances-config.service';

describe('CfAppInstancesConfigService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModules()),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        CfAppInstancesConfigService,
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppInstancesConfigService);
    expect(service).toBeTruthy();
  });
});
