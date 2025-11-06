import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { SteppersService } from './steppers.service';

describe('SteppersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SteppersService,
        provideZonelessChangeDetection()
      ]
    });
  });

  it('should be created', inject([SteppersService], (service: SteppersService) => {
    expect(service).toBeTruthy();
  }));
});
