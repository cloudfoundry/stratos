import { TestBed, inject } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PageHeaderService } from './page-header.service';

describe('PageHeaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PageHeaderService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', inject([PageHeaderService], (service: PageHeaderService) => {
    expect(service).toBeTruthy();
  }));
});
