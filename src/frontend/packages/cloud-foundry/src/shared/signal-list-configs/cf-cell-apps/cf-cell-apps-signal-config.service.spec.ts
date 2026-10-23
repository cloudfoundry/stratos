import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CfCellAppsSignalConfigService } from './cf-cell-apps-signal-config.service';

const CNSI = 'cf-1';
const CELL = 'cell-1';
const CPU_QUERY = `firehose_container_metric_cpu_percentage{bosh_job_id="${CELL}"}`;

describe('CfCellAppsSignalConfigService', () => {
  let svc: CfCellAppsSignalConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    svc = TestBed.inject(CfCellAppsSignalConfigService);
    http = TestBed.inject(HttpTestingController);
    svc.initialize(CNSI, CELL);
  });

  afterEach(() => http.verify());

  it('queries app placement on the CF-level metrics route, not the cells route', async () => {
    const done = svc.loadAll();

    // The cells route allow-list only admits rep metrics, so a container
    // metric sent there is rejected. App placement lives behind the
    // CF-level route, which checks the user is a CF admin.
    const req = http.expectOne(r => r.url.startsWith('/pp/v1/metrics/'));
    expect(req.request.url).toBe(`/pp/v1/metrics/cf/query?query=${CPU_QUERY}`);
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(CNSI);

    req.flush({
      [CNSI]: {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: { application_id: 'app-1', instance_index: '2' }, value: [1, '0.5'] }],
        },
      },
    });
    // The app lookup is issued after the metrics promise settles.
    const appReq = await vi.waitFor(() => http.expectOne(`/pp/v1/cf/apps/${CNSI}/app-1`));
    appReq.flush({
      name: 'my-app', spaceGuid: 's-1', spaceName: 'dev', orgGuid: 'o-1', orgName: 'org',
    });
    await done;

    expect(svc.rows()).toEqual([{
      cnsiGuid: CNSI, appGuid: 'app-1', instanceIndex: 2, name: 'my-app',
      spaceGuid: 's-1', spaceName: 'dev', orgGuid: 'o-1', orgName: 'org',
    }]);
  });
});
