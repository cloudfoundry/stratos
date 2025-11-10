import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfStoreModules, generateTestApplicationServiceProvider, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  const appId = '1';
  const cfId = '2';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
      ],
      providers: [
        generateTestApplicationServiceProvider(appId, cfId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ApplicationService);
    expect(service).toBeTruthy();
  });
});
