import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { MetricsService } from './services/metrics-service';

// MetricsModule provided MetricsService app-wide until the NgModule removal
// (f5d764c7c0).
describe('MetricsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  // The card details and the metrics endpoint page are created outside any
  // component that could provide it.
  it('provides MetricsService app-wide', () => {
    expect(TestBed.inject(MetricsService)).toBeInstanceOf(MetricsService);
  });
});
