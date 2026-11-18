import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CfCellHealthSignalConfigService, CfCellHealthState } from './cf-cell-health-signal-config.service';

const CNSI = 'cf-1';
const CELL = 'cell-1';
const HEALTHY = 'firehose_value_metric_rep_garden_health_check_failed';
const NOW = 1_760_000_000; // unix seconds

// Answers a request the way Prometheus does: an instant query
// (/query) returns a vector, one [ts, value] pair per series under
// `value`; a range query (/query_range) returns a matrix, the samples
// over the window under `values`. Only the current health metric has
// samples; the pre-v2.31 one has none.
function answerLikePrometheus(req: TestRequest, samples: [number, string][]): void {
  const url = req.request.urlWithParams;
  const isRange = url.includes('/query_range?');
  const result = url.includes(HEALTHY)
    ? [isRange
      ? { metric: { bosh_job_id: CELL }, values: samples }
      : { metric: { bosh_job_id: CELL }, value: samples[samples.length - 1] }]
    : [];
  req.flush({ [CNSI]: { status: 'success', data: { resultType: isRange ? 'matrix' : 'vector', result } } });
}

// Answers every cells-route request until `done` settles.
async function serveUntil(http: HttpTestingController, done: Promise<void>, samples: [number, string][]): Promise<void> {
  let settled = false;
  void done.then(() => { settled = true; });
  while (!settled) {
    http.match(r => r.url.startsWith('/pp/v1/metrics/cf/cells/')).forEach(r => answerLikePrometheus(r, samples));
    await Promise.resolve();
  }
}

describe('CfCellHealthSignalConfigService', () => {
  let svc: CfCellHealthSignalConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW * 1000);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    svc = TestBed.inject(CfCellHealthSignalConfigService);
    http = TestBed.inject(HttpTestingController);
    svc.initialize(CNSI, CELL);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('lists the health changes Prometheus reports for the cell', async () => {
    await serveUntil(http, svc.loadAll(), [
      [NOW - 3600, '0'],
      [NOW - 3528, '0'],
      [NOW - 3456, '1'],
      [NOW - 3384, '0'],
    ]);

    expect(svc.rows()).toEqual([
      { timestamp: NOW - 3600, state: CfCellHealthState.INITIAL_HEALTHY },
      { timestamp: NOW - 3456, state: CfCellHealthState.UNHEALTHY },
      { timestamp: NOW - 3384, state: CfCellHealthState.HEALTHY },
    ]);
    expect(svc.availability()).toBe(true);
  });

  it('asks for the past hour as a range, 50 steps', async () => {
    const done = svc.loadAll();
    const req = http.expectOne(r => r.url.startsWith('/pp/v1/metrics/cf/cells/'));
    const url = new URL(req.request.urlWithParams, 'http://x');
    expect(url.pathname).toBe('/pp/v1/metrics/cf/cells/query_range');
    expect(url.searchParams.get('query')).toBe(`${HEALTHY}{bosh_job_id="${CELL}"}`);
    expect(url.searchParams.get('start')).toBe(String(NOW - 3600));
    expect(url.searchParams.get('end')).toBe(String(NOW));
    expect(url.searchParams.get('step')).toBe('72');
    answerLikePrometheus(req, [[NOW, '0']]);
    await done;
  });
});
