import { describe, it, expect, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ActiveRouteCfCell } from '../../../cf-page.types';
import { CellMetrics, CloudFoundryCellService } from './cloud-foundry-cell.service';

const CNSI = 'cf-1';
const CELL = 'cell-1';

const isQuery = (metric: string) => (r: { url: string }) =>
  r.url === `/pp/v1/metrics/cf/cells/query?query=${metric}{bosh_job_id="${CELL}"}`;

const vector = (value: string, metric: Record<string, string> = {}) => ({
  [CNSI]: { status: 'success', data: { resultType: 'vector', result: [{ metric, value: [1, value] }] } },
});

const flushWhenSent = async (http: HttpTestingController, metric: string, body: unknown, opts?: { status: number; statusText: string }) => {
  for (let i = 0; i < 50; i++) {
    const reqs = http.match(isQuery(metric));
    if (reqs.length) {
      reqs.forEach(r => r.flush(body, opts));
      return;
    }
    await new Promise(r => setTimeout(r, 0));
  }
  throw new Error(`no request for ${metric}`);
};

const fail = { status: 500, statusText: 'Internal Server Error' };

describe('CloudFoundryCellService', () => {
  let svc: CloudFoundryCellService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfCell, useValue: { cfGuid: CNSI, cellId: CELL } },
        CloudFoundryCellService,
      ],
    });
    svc = TestBed.inject(CloudFoundryCellService);
    http = TestBed.inject(HttpTestingController);
  });

  // The tile metrics are requested when the service is built, so not
  // every test answers every request; no verify().

  it('starts with no error', () => {
    expect(svc.error()).toBeNull();
  });

  it('emits the cell labels when the health metric has a sample', async () => {
    const cell = firstValueFrom(svc.cellMetric$);
    await flushWhenSent(http, CellMetrics.HEALTHY, vector('0'));
    await flushWhenSent(http, CellMetrics.HEALTHY, vector('0', { bosh_job_id: CELL }));
    expect((await cell)?.bosh_job_id).toBe(CELL);
    expect(svc.error()).toBeNull();
  });

  it('emits null and records the error when the cell metric request fails', async () => {
    const cell = firstValueFrom(svc.cellMetric$);
    // The probe fails on the current metric, falls back to the
    // pre-v2.31 one, and that request fails too.
    await flushWhenSent(http, CellMetrics.HEALTHY, 'boom', fail);
    await flushWhenSent(http, CellMetrics.HEALTHY_DEP, 'boom', fail);
    expect(await cell).toBeNull();
    expect(svc.error()).toContain('500');
  });

  it('emits null for a value and records the error when a tile metric request fails', async () => {
    const cpus = firstValueFrom(svc.cpus$);
    await flushWhenSent(http, CellMetrics.CPUS, 'boom', fail);
    expect(await cpus).toBeNull();
    expect(svc.error()).toContain('500');
  });

  it('emits null usage, not a number, when a usage input failed', async () => {
    const usage = firstValueFrom(svc.usageMemory$);
    await flushWhenSent(http, CellMetrics.REMAINING_MEMORY, 'boom', fail);
    await flushWhenSent(http, CellMetrics.TOTAL_MEMORY, vector('4096'));
    expect(await usage).toBeNull();
  });

  it('computes usage as total minus remaining', async () => {
    const usage = firstValueFrom(svc.usageMemory$);
    await flushWhenSent(http, CellMetrics.REMAINING_MEMORY, vector('1024'));
    await flushWhenSent(http, CellMetrics.TOTAL_MEMORY, vector('4096'));
    expect(await usage).toBe(3072);
  });
});
