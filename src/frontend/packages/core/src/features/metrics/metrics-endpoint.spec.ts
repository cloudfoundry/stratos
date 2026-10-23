import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { stratosEntityCatalog } from '@stratosui/store';

import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details/metrics-endpoint-details.component';
import { generateCoreStratosEntities } from './metrics-endpoint';
import { MetricsService } from './services/metrics-service';

// What MetricsModule's constructor set up before the NgModule removal
// (f5d764c7c0): the Metrics type's auth types and its endpoint card details
// ("N / M sources"), whose MetricsService the module provided app-wide.
describe('generateCoreStratosEntities', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('gives the Metrics endpoint card its details', () => {
    generateCoreStratosEntities();
    expect(stratosEntityCatalog.metricsEndpoint.definition.listDetailsComponent).toBe(MetricsEndpointDetailsComponent);
  });

  // The card details and the metrics endpoint page are created outside any
  // component that could provide it.
  it('provides MetricsService app-wide', () => {
    expect(TestBed.inject(MetricsService)).toBeInstanceOf(MetricsService);
  });
});
