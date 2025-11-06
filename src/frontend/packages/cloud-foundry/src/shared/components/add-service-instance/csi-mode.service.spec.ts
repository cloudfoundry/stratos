import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CsiModeService } from './csi-mode.service';

describe('CsiModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CsiModeService,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModulesNoShared(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CsiModeService);
    expect(service).toBeTruthy();
  });
});
