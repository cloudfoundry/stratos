import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HttpXsrfHeaderExtractor, xsrfInterceptor } from '../../../../core/src/xsrf.module';
import { ChartsService } from './shared/services/charts.service';
import { createMonocularProviders } from './stratos-monocular-providers.helpers';

describe('createMonocularProviders', () => {
  const chartsUrl = '/pp/v1/chartsvc/v1/charts';
  let seenByApp: string[];
  let charts: ChartsService;
  let httpMock: HttpTestingController;

  // Stands in for the app's own interceptors: records every request it sees.
  const recordingInterceptor: HttpInterceptorFn = (req, next) => {
    seenByApp.push(req.url);
    return next(req);
  };

  beforeEach(() => {
    seenByApp = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([xsrfInterceptor, recordingInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { endpoint: 'hub-endpoint-guid' }, queryParams: {} } }
        },
      ]
    });
    // The Monocular components list these providers; build the same scope here.
    const scope = createEnvironmentInjector(createMonocularProviders(), TestBed.inject(EnvironmentInjector));
    charts = scope.get(ChartsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    HttpXsrfHeaderExtractor.stratosXSRFToken = '';
  });

  it('sends chart requests through the app interceptors and keeps the endpoint header', () => {
    charts.getCharts().subscribe();

    const req = httpMock.expectOne(chartsUrl);
    expect(seenByApp).toEqual([chartsUrl]);
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe('hub-endpoint-guid');
    req.flush({ data: [] });
  });

  it('lets the app XSRF interceptor read the token from chart responses', () => {
    charts.getCharts().subscribe();

    httpMock.expectOne(chartsUrl).flush({ data: [] }, { headers: { 'X-XSRF-Token': 'token-from-chartsvc' } });
    expect(HttpXsrfHeaderExtractor.stratosXSRFToken).toBe('token-from-chartsvc');
  });
});
