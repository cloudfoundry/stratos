/**
 * Load-performance measurement helpers for the diagnostics pages.
 * Pure functions over Performance API entries so numbers collected on
 * different deployments are directly comparable.
 */

export interface ResourceRow {
  path: string;
  startMs: number;
  durationMs: number;
  transferBytes: number;
  decodedBytes: number;
  protocol: string;
  cached: boolean;
}

export interface CacheVerdict {
  kind: 'cold' | 'warm';
  cachedFraction: number;
}

/**
 * Classify a load as cold (empty/bypassed HTTP cache) or warm (primed cache)
 * from the fraction of resources served from cache. A genuinely cold load has
 * near-zero cached entries; a warm one serves most static assets from cache,
 * so the halfway mark separates them cleanly.
 */
export function classifyCache(resources: ResourceRow[]): CacheVerdict {
  const cachedFraction = resources.length
    ? resources.filter(r => r.cached).length / resources.length
    : 0;
  return { kind: cachedFraction >= 0.5 ? 'warm' : 'cold', cachedFraction };
}

/** Pre-response time of the document request, decomposed from navigation timing. */
export interface DocPhases {
  stalledMs: number;
  dnsMs: number;
  tcpMs: number;
  tlsMs: number;
  serverWaitMs: number;
}

export interface LoadReport {
  collectedAt: string;
  topology: 'cf-pushed' | 'local/other';
  requestId: string | null;
  protocol: string;
  /**
   * When the document request hit the wire — the app-clock zero. Time before
   * this (browser stall, DNS, TCP, TLS) is environment the app cannot
   * influence; everything after (server wait, download, bootstrap, paint)
   * is Stratos's to optimize. 0 when navigation timing is unavailable.
   */
  requestStartMs: number;
  responseStartMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
  firstContentfulPaintMs: number | null;
  lcpMs: number | null;
  lcpElement: string | null;
  /** All recorded resources — keeps accumulating after load (see splitByLoad). */
  requestCount: number;
  totalTransferBytes: number;
  initialRequestCount: number;
  initialTransferBytes: number;
  sinceLoadRequestCount: number;
  sinceLoadTransferBytes: number;
  phases: DocPhases | null;
  resources: ResourceRow[];
}

/**
 * Decompose the document request's pre-response time. A large stalled phase
 * means the browser sat on the request before even resolving DNS (queueing,
 * cache lookup, proxy/cert checks) — time no server-side change can recover.
 * On a reused connection DNS/TCP/TLS all collapse to zero.
 */
export function computePhases(nav: PerformanceNavigationTiming | undefined): DocPhases | null {
  if (!nav) { return null; }
  const tls = nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0;
  return {
    stalledMs: nav.domainLookupStart - nav.fetchStart,
    dnsMs: nav.domainLookupEnd - nav.domainLookupStart,
    tcpMs: (nav.secureConnectionStart > 0 ? nav.secureConnectionStart : nav.connectEnd) - nav.connectStart,
    tlsMs: tls,
    serverWaitMs: nav.responseStart - nav.requestStart,
  };
}

/**
 * Split resource totals at the load event, so the initial-load cost stays
 * readable while background traffic (idle prefetch, API polling, lazy route
 * chunks) accumulates separately. loadEventMs 0 means the load event has not
 * fired yet — everything recorded so far is initial.
 */
export function splitByLoad(resources: ResourceRow[], loadEventMs: number): {
  initialRequestCount: number;
  initialTransferBytes: number;
  sinceLoadRequestCount: number;
  sinceLoadTransferBytes: number;
} {
  const cutoff = loadEventMs || Infinity;
  let initialRequestCount = 0, initialTransferBytes = 0;
  let sinceLoadRequestCount = 0, sinceLoadTransferBytes = 0;
  for (const r of resources) {
    if (r.startMs <= cutoff) {
      initialRequestCount++;
      initialTransferBytes += r.transferBytes;
    } else {
      sinceLoadRequestCount++;
      sinceLoadTransferBytes += r.transferBytes;
    }
  }
  return { initialRequestCount, initialTransferBytes, sinceLoadRequestCount, sinceLoadTransferBytes };
}

/**
 * Map resource timing entries to rows, sorted by start time.
 * cached: transferSize 0 (memory/disk cache), an explicit 304, or a small
 * transfer with a large decoded body (304 heuristic for browsers without
 * responseStatus — real 304s report decodedBodySize 0).
 */
export function collectResources(entries: PerformanceResourceTiming[]): ResourceRow[] {
  return entries
    .map(e => {
      const transferBytes = e.transferSize ?? 0;
      const decodedBytes = e.decodedBodySize ?? 0;
      return {
        path: new URL(e.name, location.href).pathname,
        startMs: e.startTime,
        durationMs: e.duration,
        transferBytes,
        decodedBytes,
        protocol: e.nextHopProtocol ?? '',
        cached: transferBytes === 0
          || e.responseStatus === 304
          || (transferBytes < 400 && decodedBytes > 0),
      };
    })
    .sort((a, b) => a.startMs - b.startMs);
}

/**
 * Probe /favicon.ico: gorouter stamps x-vcap-request-id on every response,
 * so its presence means the app is running behind a CF deployment.
 */
export async function detectTopology(
  fetchFn: typeof fetch = fetch,
): Promise<{ topology: 'cf-pushed' | 'local/other'; requestId: string | null }> {
  try {
    const response = await fetchFn('/favicon.ico', { cache: 'no-store' });
    const requestId = response.headers.get('x-vcap-request-id');
    if (requestId !== null) {
      return { topology: 'cf-pushed', requestId };
    }
    return { topology: 'local/other', requestId: null };
  } catch {
    return { topology: 'local/other', requestId: null };
  }
}

/**
 * Observe buffered largest-contentful-paint entries and resolve with the
 * last one after timeoutMs. Resolves nulls where the entry type is
 * unsupported.
 */
export function observeLcp(timeoutMs = 500): Promise<{ lcpMs: number | null; lcpElement: string | null }> {
  return new Promise(resolve => {
    let lcpMs: number | null = null;
    let lcpElement: string | null = null;
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          lcpMs = e.startTime;
          const el = (e as any).element;
          lcpElement = el?.tagName ?? null;
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      resolve({ lcpMs: null, lcpElement: null });
      return;
    }
    setTimeout(() => {
      try { observer?.disconnect(); } catch { /* already stopped */ }
      resolve({ lcpMs, lcpElement });
    }, timeoutMs);
  });
}

/**
 * Observe buffered paint entries and resolve with the first-contentful-paint
 * time after timeoutMs. A buffered observer is needed because this page can
 * measure before the app's own first paint has happened, in which case the
 * synchronous paint entries are still empty.
 */
export function observeFcp(timeoutMs = 500): Promise<number | null> {
  return new Promise(resolve => {
    let fcpMs: number | null = null;
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') {
            fcpMs = e.startTime;
          }
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      resolve(null);
      return;
    }
    setTimeout(() => {
      try { observer?.disconnect(); } catch { /* already stopped */ }
      resolve(fcpMs);
    }, timeoutMs);
  });
}

/** Assemble a full load report from the Performance API and a topology probe. */
export async function buildLoadReport(): Promise<LoadReport> {
  const nav = safeEntries<PerformanceNavigationTiming>('navigation')[0];
  const paints = safeEntries<PerformancePaintTiming>('paint');
  const resources = collectResources(safeEntries<PerformanceResourceTiming>('resource'));

  const fcp = paints.find(p => p.name === 'first-contentful-paint');
  const [{ topology, requestId }, { lcpMs, lcpElement }, observedFcpMs] = await Promise.all([
    detectTopology(),
    observeLcp(),
    fcp ? Promise.resolve(null) : observeFcp(),
  ]);

  const loadEventMs = nav?.loadEventEnd ?? 0;
  return {
    collectedAt: new Date().toISOString(),
    topology,
    requestId,
    protocol: nav?.nextHopProtocol ?? '',
    requestStartMs: nav?.requestStart ?? 0,
    responseStartMs: nav?.responseStart ?? 0,
    domContentLoadedMs: nav?.domContentLoadedEventEnd ?? 0,
    loadEventMs,
    firstContentfulPaintMs: fcp ? fcp.startTime : observedFcpMs,
    lcpMs,
    lcpElement,
    requestCount: resources.length,
    totalTransferBytes: resources.reduce((sum, r) => sum + r.transferBytes, 0),
    ...splitByLoad(resources, loadEventMs),
    phases: computePhases(nav),
    resources,
  };
}

function safeEntries<T extends PerformanceEntry>(type: string): T[] {
  try {
    return (performance.getEntriesByType?.(type) ?? []) as T[];
  } catch {
    return [];
  }
}

const ms = (n: number | null): string => n === null ? 'n/a' : `${n.toFixed(0)} ms`;

/** Milestone on the app clock: time since the request hit the wire. */
export const appMs = (n: number | null, requestStartMs: number): string | null =>
  n === null || !requestStartMs ? null : `${Math.max(0, n - requestStartMs).toFixed(0)} ms`;

const withAppClock = (n: number | null, r: LoadReport): string => {
  const app = appMs(n, r.requestStartMs);
  return app === null ? ms(n) : `${ms(n)} (${app} from request start)`;
};

/** GitHub-pasteable markdown: summary table + top-20-by-transfer resources. */
export function reportToMarkdown(r: LoadReport): string {
  const lines: string[] = [
    '### Load performance report',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Collected at | ${r.collectedAt} |`,
    `| Topology | ${r.topology}${r.requestId ? ` (request-id ${r.requestId})` : ''} |`,
    `| Protocol | ${r.protocol || 'unknown'} |`,
    `| Response start | ${withAppClock(r.responseStartMs, r)} |`,
    ...(r.phases ? [
      `| Document fetch | stalled ${ms(r.phases.stalledMs)} · DNS ${ms(r.phases.dnsMs)} · TCP ${ms(r.phases.tcpMs)} · TLS ${ms(r.phases.tlsMs)} · server wait ${ms(r.phases.serverWaitMs)} |`,
    ] : []),
    `| DOMContentLoaded | ${withAppClock(r.domContentLoadedMs, r)} |`,
    `| Load event | ${withAppClock(r.loadEventMs, r)} |`,
    `| First contentful paint | ${withAppClock(r.firstContentfulPaintMs, r)} |`,
    `| Largest contentful paint | ${withAppClock(r.lcpMs, r)}${r.lcpElement ? ` (${r.lcpElement})` : ''} |`,
    `| Requests (initial load) | ${r.initialRequestCount} |`,
    `| Total transfer (initial load) | ${r.initialTransferBytes} bytes |`,
    `| Since load | +${r.sinceLoadRequestCount} requests, +${r.sinceLoadTransferBytes} bytes |`,
    '',
    '#### Top resources by transfer size',
    '',
    '| Path | Start | Duration | Transfer | Decoded | Protocol | Cached |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  const top = [...r.resources]
    .sort((a, b) => b.transferBytes - a.transferBytes)
    .slice(0, 20);
  for (const res of top) {
    lines.push(
      `| ${res.path} | ${ms(res.startMs)} | ${ms(res.durationMs)} ` +
      `| ${res.transferBytes} | ${res.decodedBytes} | ${res.protocol || 'unknown'} ` +
      `| ${res.cached ? 'yes' : 'no'} |`,
    );
  }
  return lines.join('\n');
}

export function reportToJson(r: LoadReport): string {
  return JSON.stringify(r, null, 2);
}
