import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { generateCfBaseTestModules } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceActionHelperService } from './service-action-helper.service';

describe('ServiceActionHelperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceActionHelperService, ConfirmationDialogService,
        provideZonelessChangeDetection(),
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceActionHelperService);
    expect(service).toBeTruthy();
  });
});
