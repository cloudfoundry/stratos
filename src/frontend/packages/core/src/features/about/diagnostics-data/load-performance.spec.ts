import { describe, it, expect } from 'vitest';

import {
  classifyCache,
  collectResources,
  computePhases,
  detectTopology,
  documentRow,
  buildLoadReport,
  observeFcp,
  reportToMarkdown,
  reportToJson,
  splitByLoad,
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
  requestStartMs: 10,
  responseStartMs: 12,
  domContentLoadedMs: 300,
  loadEventMs: 500,
  firstContentfulPaintMs: 250,
  lcpMs: 400,
  lcpElement: 'IMG',
  requestCount: 2,
  totalTransferBytes: 4096,
  initialRequestCount: 2,
  initialTransferBytes: 4096,
  sinceLoadRequestCount: 0,
  sinceLoadTransferBytes: 0,
  phases: { stalledMs: 5, dnsMs: 1, tcpMs: 2, tlsMs: 3, serverWaitMs: 1 },
  document: null,
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

  it('flags a 304 revalidation (headers transferred, empty body) as cached', () => {
    // Real 304s report decodedBodySize 0, so the small-transfer/large-decoded
    // heuristic misses them; responseStatus is the reliable signal.
    const rows = collectResources([
      entry({ transferSize: 300, decodedBodySize: 0, responseStatus: 304 } as Partial<PerformanceResourceTiming>),
    ]);
    expect(rows[0].cached).toBe(true);
  });

  it('does not flag a small 200 with an empty body as cached', () => {
    const rows = collectResources([
      entry({ transferSize: 300, decodedBodySize: 0, responseStatus: 200 } as Partial<PerformanceResourceTiming>),
    ]);
    expect(rows[0].cached).toBe(false);
  });
});

describe('computePhases', () => {
  const nav = (overrides: Partial<PerformanceNavigationTiming>): PerformanceNavigationTiming => ({
    fetchStart: 3,
    domainLookupStart: 594,
    domainLookupEnd: 594,
    connectStart: 594,
    secureConnectionStart: 688,
    connectEnd: 974,
    requestStart: 974,
    responseStart: 1178,
    ...overrides,
  } as PerformanceNavigationTiming);

  it('decomposes the pre-response time into phases', () => {
    expect(computePhases(nav({}))).toEqual({
      stalledMs: 591,
      dnsMs: 0,
      tcpMs: 94,
      tlsMs: 286,
      serverWaitMs: 204,
    });
  });

  it('reports zero tcp/tls on a reused connection', () => {
    expect(computePhases(nav({
      domainLookupStart: 3, domainLookupEnd: 3,
      connectStart: 3, secureConnectionStart: 0, connectEnd: 3,
      requestStart: 10, responseStart: 50,
    }))).toEqual({
      stalledMs: 0,
      dnsMs: 0,
      tcpMs: 0,
      tlsMs: 0,
      serverWaitMs: 40,
    });
  });

  it('returns null without a navigation entry', () => {
    expect(computePhases(undefined)).toBeNull();
  });
});

describe('documentRow', () => {
  const nav = (overrides: Partial<PerformanceNavigationTiming>): PerformanceNavigationTiming => ({
    name: 'http://localhost/',
    startTime: 0,
    fetchStart: 5,
    domainLookupStart: 325,
    domainLookupEnd: 786,
    connectStart: 786,
    secureConnectionStart: 883,
    connectEnd: 1107,
    requestStart: 1107,
    responseStart: 1319,
    responseEnd: 1400,
    transferSize: 5000,
    ...overrides,
  } as PerformanceNavigationTiming);

  it('builds a phase-segmented row spanning navigation start to response end', () => {
    const d = documentRow(nav({}))!;
    expect(d.path).toBe('/');
    expect(d.startMs).toBe(0);
    expect(d.endMs).toBe(1400);
    expect(d.transferBytes).toBe(5000);
    expect(d.segments).toEqual([
      { label: 'stalled', startMs: 5, durationMs: 320 },
      { label: 'DNS', startMs: 325, durationMs: 461 },
      { label: 'TCP', startMs: 786, durationMs: 97 },
      { label: 'TLS', startMs: 883, durationMs: 224 },
      { label: 'server wait', startMs: 1107, durationMs: 212 },
      { label: 'download', startMs: 1319, durationMs: 81 },
    ]);
  });

  it('omits zero-length phases (reused connection: no DNS/TCP/TLS)', () => {
    const d = documentRow(nav({
      fetchStart: 3, domainLookupStart: 3, domainLookupEnd: 3,
      connectStart: 3, secureConnectionStart: 0, connectEnd: 3,
      requestStart: 10, responseStart: 50, responseEnd: 60,
    }))!;
    expect(d.segments).toEqual([
      { label: 'server wait', startMs: 10, durationMs: 40 },
      { label: 'download', startMs: 50, durationMs: 10 },
    ]);
  });

  it('labels a document-level redirect instead of leaving a leading void', () => {
    const d = documentRow(nav({ redirectStart: 1, redirectEnd: 200, fetchStart: 200, domainLookupStart: 325 }))!;
    expect(d.segments[0]).toEqual({ label: 'redirect', startMs: 1, durationMs: 199 });
    expect(d.segments[1]).toEqual({ label: 'stalled', startMs: 200, durationMs: 125 });
  });

  it('returns null without a navigation entry', () => {
    expect(documentRow(undefined)).toBeNull();
  });
});

describe('splitByLoad', () => {
  const res = (startMs: number, transferBytes: number) => ({
    path: '/x.js', startMs, durationMs: 1, transferBytes,
    decodedBytes: 1, protocol: 'h2', cached: false,
  });

  it('splits resources at the load event', () => {
    expect(splitByLoad([res(100, 10), res(499, 20), res(501, 40)], 500)).toEqual({
      initialRequestCount: 2,
      initialTransferBytes: 30,
      sinceLoadRequestCount: 1,
      sinceLoadTransferBytes: 40,
    });
  });

  it('counts everything as initial while the load event has not fired (loadEventMs 0)', () => {
    expect(splitByLoad([res(100, 10), res(900, 20)], 0)).toEqual({
      initialRequestCount: 2,
      initialTransferBytes: 30,
      sinceLoadRequestCount: 0,
      sinceLoadTransferBytes: 0,
    });
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
  it('reports initial-load totals with the since-load overflow alongside', () => {
    const r = sampleReport();
    r.requestCount = 5;
    r.totalTransferBytes = 9096;
    r.initialRequestCount = 2;
    r.initialTransferBytes = 4096;
    r.sinceLoadRequestCount = 3;
    r.sinceLoadTransferBytes = 5000;
    const md = reportToMarkdown(r);
    expect(md).toContain('| Requests (initial load) | 2 |');
    expect(md).toContain('| Total transfer (initial load) | 4096 bytes |');
    expect(md).toContain('| Since load | +3 requests, +5000 bytes |');
  });

  it('includes the document fetch phases', () => {
    const md = reportToMarkdown(sampleReport());
    expect(md).toContain('| Document fetch | stalled 5 ms · DNS 1 ms · TCP 2 ms · TLS 3 ms · server wait 1 ms |');
  });

  it('shows each milestone on the app clock (browser/network setup subtracted)', () => {
    const md = reportToMarkdown(sampleReport());
    expect(md).toContain('| Response start | 12 ms (2 ms from request start) |');
    expect(md).toContain('| DOMContentLoaded | 300 ms (290 ms from request start) |');
    expect(md).toContain('| First contentful paint | 250 ms (240 ms from request start) |');
  });

  it('keeps a null milestone as n/a with no app clock', () => {
    const r = sampleReport();
    r.firstContentfulPaintMs = null;
    expect(reportToMarkdown(r)).toContain('| First contentful paint | n/a |');
  });

  it('omits the app clock when request start is unknown', () => {
    const r = sampleReport();
    r.requestStartMs = 0;
    expect(reportToMarkdown(r)).toContain('| Response start | 12 ms |');
  });

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

describe('observeFcp', () => {
  it('resolves the first-contentful-paint time from buffered paint entries', async () => {
    const RealObserver = globalThis.PerformanceObserver;
    class FakeObserver {
      constructor(private cb: (list: { getEntries: () => unknown[] }) => void) {}
      observe(options: { type: string; buffered: boolean }) {
        expect(options.type).toBe('paint');
        expect(options.buffered).toBe(true);
        this.cb({
          getEntries: () => [
            { name: 'first-paint', startTime: 1200 },
            { name: 'first-contentful-paint', startTime: 1234 },
          ],
        });
      }
      disconnect() { /* noop */ }
    }
    (globalThis as any).PerformanceObserver = FakeObserver;
    try {
      expect(await observeFcp(10)).toBe(1234);
    } finally {
      (globalThis as any).PerformanceObserver = RealObserver;
    }
  });

  it('resolves null when the observer is unsupported', async () => {
    const RealObserver = globalThis.PerformanceObserver;
    (globalThis as any).PerformanceObserver = undefined;
    try {
      expect(await observeFcp(10)).toBeNull();
    } finally {
      (globalThis as any).PerformanceObserver = RealObserver;
    }
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

describe('classifyCache', () => {
  const res = (cached: boolean) => ({
    path: '/x.js', startMs: 0, durationMs: 1, transferBytes: 1,
    decodedBytes: 1, protocol: 'h2', cached,
  });

  it('calls an uncached load cold', () => {
    expect(classifyCache([res(false), res(false), res(false)]))
      .toEqual({ kind: 'cold', cachedFraction: 0 });
  });

  it('calls a mostly-cached load warm', () => {
    const verdict = classifyCache([res(true), res(true), res(false)]);
    expect(verdict.kind).toBe('warm');
    expect(verdict.cachedFraction).toBeCloseTo(2 / 3);
  });

  it('puts the boundary at half cached', () => {
    expect(classifyCache([res(true), res(false)]).kind).toBe('warm');
  });

  it('treats an empty resource list as cold', () => {
    expect(classifyCache([]).kind).toBe('cold');
  });
});
