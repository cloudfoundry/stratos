import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CsiGuidsService } from './csi-guids.service';

describe('CsiGuidsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CsiGuidsService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CsiGuidsService);
    expect(service).toBeTruthy();
  });
});
