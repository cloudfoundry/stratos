import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CsiModeService } from './csi-mode.service';

describe('CsiModeService', () => {
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockActivatedRoute = {
      snapshot: {
        params: {},
        queryParams: {},
        queryParamMap: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    } as unknown as Partial<ActivatedRoute>;

    mockRouter = {
      getCurrentNavigation: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        CsiModeService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        provideZonelessChangeDetection(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CsiModeService);
    expect(service).toBeTruthy();
  });
});
