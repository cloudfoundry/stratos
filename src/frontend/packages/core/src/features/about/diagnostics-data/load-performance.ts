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

export interface LoadReport {
  collectedAt: string;
  topology: 'cf-pushed' | 'local/other';
  requestId: string | null;
  protocol: string;
  responseStartMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
  firstContentfulPaintMs: number | null;
  lcpMs: number | null;
  lcpElement: string | null;
  requestCount: number;
  totalTransferBytes: number;
  resources: ResourceRow[];
}

/**
 * Map resource timing entries to rows, sorted by start time.
 * cached: transferSize 0 (memory/disk cache) or a small transfer with a
 * large decoded body (304 revalidation).
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
        cached: transferBytes === 0 || (transferBytes < 400 && decodedBytes > 0),
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

/** Assemble a full load report from the Performance API and a topology probe. */
export async function buildLoadReport(): Promise<LoadReport> {
  const nav = safeEntries<PerformanceNavigationTiming>('navigation')[0];
  const paints = safeEntries<PerformancePaintTiming>('paint');
  const resources = collectResources(safeEntries<PerformanceResourceTiming>('resource'));

  const fcp = paints.find(p => p.name === 'first-contentful-paint');
  const [{ topology, requestId }, { lcpMs, lcpElement }] = await Promise.all([
    detectTopology(),
    observeLcp(),
  ]);

  return {
    collectedAt: new Date().toISOString(),
    topology,
    requestId,
    protocol: nav?.nextHopProtocol ?? '',
    responseStartMs: nav?.responseStart ?? 0,
    domContentLoadedMs: nav?.domContentLoadedEventEnd ?? 0,
    loadEventMs: nav?.loadEventEnd ?? 0,
    firstContentfulPaintMs: fcp ? fcp.startTime : null,
    lcpMs,
    lcpElement,
    requestCount: resources.length,
    totalTransferBytes: resources.reduce((sum, r) => sum + r.transferBytes, 0),
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
    `| Response start | ${ms(r.responseStartMs)} |`,
    `| DOMContentLoaded | ${ms(r.domContentLoadedMs)} |`,
    `| Load event | ${ms(r.loadEventMs)} |`,
    `| First contentful paint | ${ms(r.firstContentfulPaintMs)} |`,
    `| Largest contentful paint | ${ms(r.lcpMs)}${r.lcpElement ? ` (${r.lcpElement})` : ''} |`,
    `| Requests | ${r.requestCount} |`,
    `| Total transfer | ${r.totalTransferBytes} bytes |`,
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
