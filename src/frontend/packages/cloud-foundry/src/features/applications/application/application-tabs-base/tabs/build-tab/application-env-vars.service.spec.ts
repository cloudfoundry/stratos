import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store';
import { generateCfStoreModules } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';
describe('ApplicationEnvVarsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ApplicationEnvVarsHelper,
        PaginationMonitorFactory,

        provideZonelessChangeDetection(),
      ],
      imports: [
        generateCfStoreModules(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ApplicationEnvVarsHelper);
    expect(service).toBeTruthy();
  });
});
