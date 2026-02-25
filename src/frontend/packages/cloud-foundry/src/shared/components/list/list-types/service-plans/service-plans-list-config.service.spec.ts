import { DatePipe } from '@angular/common';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../features/service-catalog/services.service.mock';
import { ServicePlansListConfigService } from './service-plans-list-config.service';

describe('ServicePlansListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        ServicePlansListConfigService,
        DatePipe,
        { provide: ServicesService, useClass: ServicesServiceMock },
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServicePlansListConfigService);
    expect(service).toBeTruthy();
  });
});
