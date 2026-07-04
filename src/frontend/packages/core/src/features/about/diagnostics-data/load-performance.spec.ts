import { describe, it, expect } from 'vitest';

import {
  collectResources,
  detectTopology,
  buildLoadReport,
  reportToMarkdown,
  reportToJson,
  LoadReport,
} from './load-performance';

const entry = (overrides: Partial<PerformanceResourceTiming>): PerformanceResourceTiming => ({
  name: 'http://localhost/main.js',
  startTime: 0,
  duration: 10,
  transferSize: 1000,
  decodedBodySize: 1000,
  nextHopProtocol: 'h2',
  ...overrides,
} as PerformanceResourceTiming);

const sampleReport = (): LoadReport => ({
  collectedAt: '2026-07-03T00:00:00.000Z',
  topology: 'cf-pushed',
  requestId: 'abc-123',
  protocol: 'h2',
  responseStartMs: 12,
  domContentLoadedMs: 300,
  loadEventMs: 500,
  firstContentfulPaintMs: 250,
  lcpMs: 400,
  lcpElement: 'IMG',
  requestCount: 2,
  totalTransferBytes: 4096,
  resources: [
    { path: '/main.js', startMs: 1, durationMs: 20, transferBytes: 3000, decodedBytes: 9000, protocol: 'h2', cached: false },
    { path: '/styles.css', startMs: 2, durationMs: 5, transferBytes: 1096, decodedBytes: 2000, protocol: 'h2', cached: false },
  ],
});

describe('collectResources', () => {
  it('maps timing entries to resource rows', () => {
    const rows = collectResources([
      entry({ name: 'http://localhost/assets/app.js', startTime: 5.4, duration: 33.2, transferSize: 2048, decodedBodySize: 8192, nextHopProtocol: 'h2' }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].path).toBe('/assets/app.js');
    expect(rows[0].startMs).toBe(5.4);
    expect(rows[0].durationMs).toBe(33.2);
    expect(rows[0].transferBytes).toBe(2048);
    expect(rows[0].decodedBytes).toBe(8192);
    expect(rows[0].protocol).toBe('h2');
    expect(rows[0].cached).toBe(false);
  });

  it('sorts rows by start time', () => {
    const rows = collectResources([
      entry({ name: 'http://localhost/b.js', startTime: 20 }),
      entry({ name: 'http://localhost/a.js', startTime: 5 }),
    ]);
    expect(rows.map(r => r.path)).toEqual(['/a.js', '/b.js']);
  });

  it('flags transferSize === 0 with decoded bytes as cached', () => {
    const rows = collectResources([
      entry({ transferSize: 0, decodedBodySize: 5000 }),
    ]);
    expect(rows[0].cached).toBe(true);
  });

  it('flags small transfer with large decoded body as cached (304-style)', () => {
    const rows = collectResources([
      entry({ transferSize: 300, decodedBodySize: 5000 }),
    ]);
    expect(rows[0].cached).toBe(true);
  });

  it('does not flag a normal transfer as cached', () => {
    const rows = collectResources([
      entry({ transferSize: 5000, decodedBodySize: 5000 }),
    ]);
    expect(rows[0].cached).toBe(false);
  });

  it('does not flag an empty response (0 transfer, 0 decoded) as cached beyond the zero rule', () => {
    const rows = collectResources([
      entry({ transferSize: 0, decodedBodySize: 0 }),
    ]);
    // transferBytes === 0 counts as cached regardless of decoded size
    expect(rows[0].cached).toBe(true);
  });
});

describe('detectTopology', () => {
  it('reports cf-pushed when the x-vcap-request-id header is present', async () => {
    const fetchFn = (async () => new Response('', {
      headers: { 'x-vcap-request-id': 'abc-123' },
    })) as typeof fetch;
    const result = await detectTopology(fetchFn);
    expect(result.topology).toBe('cf-pushed');
    expect(result.requestId).toBe('abc-123');
  });

  it('reports local/other when the header is absent', async () => {
    const fetchFn = (async () => new Response('', { headers: {} })) as typeof fetch;
    const result = await detectTopology(fetchFn);
    expect(result.topology).toBe('local/other');
    expect(result.requestId).toBeNull();
  });

  it('reports local/other when the fetch fails', async () => {
    const fetchFn = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    const result = await detectTopology(fetchFn);
    expect(result.topology).toBe('local/other');
    expect(result.requestId).toBeNull();
  });
});

describe('reportToMarkdown', () => {
  it('includes the topology and resource paths', () => {
    const md = reportToMarkdown(sampleReport());
    expect(md).toContain('cf-pushed');
    expect(md).toContain('/main.js');
    expect(md).toContain('h2');
  });

  it('limits the resource table to the top 20 by transfer size', () => {
    const r = sampleReport();
    r.resources = Array.from({ length: 30 }, (_, i) => ({
      path: `/chunk-${i}.js`,
      startMs: i,
      durationMs: 1,
      transferBytes: 1000 - i, // descending so chunk-0..chunk-19 are the top 20
      decodedBytes: 1000,
      protocol: 'h2',
      cached: false,
    }));
    const md = reportToMarkdown(r);
    expect(md).toContain('/chunk-0.js');
    expect(md).toContain('/chunk-19.js');
    expect(md).not.toContain('/chunk-20.js');
  });
});

describe('reportToJson', () => {
  it('round-trips through JSON.parse', () => {
    const r = sampleReport();
    const parsed = JSON.parse(reportToJson(r));
    expect(parsed).toEqual(r);
  });
});

describe('buildLoadReport', () => {
  it('resolves with a well-formed report in a minimal browser environment', async () => {
    const r = await buildLoadReport();
    expect(r.topology === 'cf-pushed' || r.topology === 'local/other').toBe(true);
    expect(r.requestId === null || typeof r.requestId === 'string').toBe(true);
    expect(typeof r.collectedAt).toBe('string');
    expect(typeof r.protocol).toBe('string');
    expect(typeof r.responseStartMs).toBe('number');
    expect(typeof r.domContentLoadedMs).toBe('number');
    expect(typeof r.loadEventMs).toBe('number');
    expect(r.firstContentfulPaintMs === null || typeof r.firstContentfulPaintMs === 'number').toBe(true);
    expect(r.lcpMs === null || typeof r.lcpMs === 'number').toBe(true);
    expect(typeof r.requestCount).toBe('number');
    expect(typeof r.totalTransferBytes).toBe('number');
    expect(Array.isArray(r.resources)).toBe(true);
  });
});
