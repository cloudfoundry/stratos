import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { EndpointModel } from '@stratosui/store';
import { createBasicStoreModule, seedEndpointsDataService, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { MetricsService } from './metrics-service';

describe('MetricsService', () => {
  const provider = { guid: 'm1', name: 'metrics', cnsi_type: 'metrics' } as EndpointModel;
  const cf = {
    guid: 'cf1', name: 'cf', cnsi_type: 'cf',
    api_endpoint: { Scheme: 'https', Host: 'api.example.com', Path: '' },
    metadata: { metrics: 'm1' },
  } as unknown as EndpointModel;
  const other = { guid: 'k1', name: 'k8s', cnsi_type: 'k8s' } as EndpointModel;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [createBasicStoreModule()],
      providers: [...STORE_TEST_PROVIDERS, provideZonelessChangeDetection()],
    });
    seedEndpointsDataService([provider, cf, other]);
  });

  it('groups the endpoints each metrics endpoint provides for', async () => {
    const result = await firstValueFrom(TestBed.inject(MetricsService).metricsEndpoints$);
    expect(result.map(r => [r.provider.guid, r.endpoints.map(e => e.guid)])).toEqual([['m1', ['cf1']]]);
  });

  // The endpoints are the shared endpoint list's own objects.
  it('leaves the endpoints it groups as they were', async () => {
    await firstValueFrom(TestBed.inject(MetricsService).metricsEndpoints$);
    expect(Object.keys(cf)).not.toContain('url');
  });
});
