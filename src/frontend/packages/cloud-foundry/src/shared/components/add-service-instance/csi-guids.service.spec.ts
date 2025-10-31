import { TestBed, inject } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CsiGuidsService } from './csi-guids.service';

describe('CsiGuidsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsiGuidsService]
    });
  });

  it('should be created', inject([CsiGuidsService], (service: CsiGuidsService) => {
    expect(service).toBeTruthy();
  }));
});
