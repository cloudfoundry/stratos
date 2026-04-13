// Dev-build-only instrumentation for CfOrgSpaceDataService, used to diagnose
// the CF→Org→Space pre-fill inconsistency tracked in FWT-917. See the umbrella
// ticket for context and which hypotheses each event kind illuminates.
//
// Zero production impact: gated on !environment.production at every entry
// point. A production build collapses log/snapshot/clear into effective
// no-ops via the `enabled` flag.
//
// Aggregation: CfOrgSpaceDataService is component-scoped (each wizard gets
// its own instance), so diagnosing hypothesis H1 — "no cross-route handoff" —
// requires comparing events across instances. The aggregator mounted on
// `window.__cfOsDebug` returns a time-sorted merge of every instance's log,
// so `await page.evaluate(() => window.__cfOsDebug.snapshot())` from a
// Playwright diagnostic harness gives the full timeline in one call.

import { environment } from '../../../../core/src/environments/environment';

export interface CfOsDebugEvent {
  t: number;
  kind: string;
  data: unknown;
  instance: number;
}

interface CfOsDebugAggregator {
  instances: CfOrgSpaceDebug[];
  snapshot: () => CfOsDebugEvent[];
  clear: () => void;
}

const MAX_EVENTS_PER_INSTANCE = 500;
let nextInstance = 1;

export class CfOrgSpaceDebug {
  readonly instance = nextInstance++;
  private readonly enabled = !environment.production;
  private events: CfOsDebugEvent[] = [];

  log(kind: string, data: unknown = null): void {
    if (!this.enabled) {
      return;
    }
    const t = performance.now();
    const ev: CfOsDebugEvent = { t, kind, data, instance: this.instance };
    this.events.push(ev);
    if (this.events.length > MAX_EVENTS_PER_INSTANCE) {
      this.events.shift();
    }
    // Visible in manual devtools console AND captured by Playwright
    // browser_console_messages. The [CFOS] prefix makes it greppable.
    console.log(`[CFOS #${this.instance} ${t.toFixed(1)}ms] ${kind}`, data);
  }

  snapshot(): CfOsDebugEvent[] {
    return this.enabled ? [...this.events] : [];
  }

  clear(): void {
    this.events = [];
  }
}

// Factory used by CfOrgSpaceDataService. In dev, registers the new instance
// with a global aggregator so Playwright can read events across every
// component-scoped service in the page. In prod, returns an instance whose
// log() is short-circuited and does not touch globalThis at all.
export function createCfOrgSpaceDebug(): CfOrgSpaceDebug {
  const debug = new CfOrgSpaceDebug();
  if (environment.production) {
    return debug;
  }
  const g = globalThis as typeof globalThis & { __cfOsDebug?: CfOsDebugAggregator };
  if (!g.__cfOsDebug) {
    const aggregator: CfOsDebugAggregator = {
      instances: [],
      snapshot: () => aggregator.instances
        .flatMap(i => i.snapshot())
        .sort((a, b) => a.t - b.t),
      clear: () => aggregator.instances.forEach(i => i.clear()),
    };
    g.__cfOsDebug = aggregator;
  }
  g.__cfOsDebug.instances.push(debug);
  return debug;
}
