import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerTarget, AutoscalerTargetDataService } from './autoscaler-target-data.service';

const TARGET: AutoscalerTarget = {
  source: 'registered',
  endpoint: { guid: 'as1', name: 'lab autoscaler', url: 'https://autoscaler.sys.x.com', personal: false },
  duplicates: { registered: [], bound: [] },
};

describe('AutoscalerTargetDataService', () => {
  let svc: AutoscalerTargetDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(AutoscalerTargetDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks the server which autoscaler the app uses', async () => {
    const done = svc.load('cf-1', 'app-1');
    const req = http.expectOne('/pp/v1/autoscaler/apps/app-1/target');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe('cf-1');
    req.flush(TARGET);
    await done;

    expect(svc.target('cf-1', 'app-1')()).toEqual(TARGET);
    expect(svc.target('cf-1', 'app-2')()).toBeNull();
  });

  // The tab works as before without the line.
  it('holds no target when the server cannot say', async () => {
    const done = svc.load('cf-1', 'app-1');
    http.expectOne('/pp/v1/autoscaler/apps/app-1/target').flush('no', { status: 500, statusText: 'Error' });
    await done;

    expect(svc.target('cf-1', 'app-1')()).toBeNull();
  });
});
