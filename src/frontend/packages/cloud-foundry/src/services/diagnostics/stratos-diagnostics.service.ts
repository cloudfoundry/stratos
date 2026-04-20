import { Injectable, Signal, computed, signal } from '@angular/core';
import {
  DiagnosticCode,
  DiagnosticCounter,
  DiagnosticSample,
  DiagnosticsQueryOptions,
  DiagnosticsSnapshotEnvelope,
} from './diagnostics.types';

type PendingEmit =
  | { kind: 'counter'; code: DiagnosticCode; dimensions: Record<string, string | number>; at: number }
  | { kind: 'sample'; code: DiagnosticCode; dimensions: Record<string, string | number>; value: number | undefined; at: number };

function dimensionsKey(d: Record<string, string | number>): string {
  return Object.entries(d)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}

@Injectable({ providedIn: 'root' })
export class StratosDiagnostics {
  private static readonly SAMPLE_CAP_PER_FAMILY = 10000;
  private readonly pending: PendingEmit[] = [];
  private readonly _counters = signal<Record<string, Map<string, DiagnosticCounter>>>({});
  private readonly _samples = signal<Record<string, DiagnosticSample[]>>({});
  private flushScheduled = false;
  private flushPromise: Promise<void> | null = null;
  private flushResolve: (() => void) | null = null;

  readonly state: Signal<DiagnosticsSnapshotEnvelope> = computed(() =>
    this.buildEnvelope(this._counters(), this._samples()),
  );

  emitCounter(code: DiagnosticCode, dimensions: Record<string, string | number>): void {
    this.pending.push({ kind: 'counter', code, dimensions, at: Date.now() });
    this.scheduleFlush();
  }

  emitSample(code: DiagnosticCode, dimensions: Record<string, string | number>, value?: number): void {
    this.pending.push({ kind: 'sample', code, dimensions, value, at: Date.now() });
    this.scheduleFlush();
  }

  snapshot(): DiagnosticsSnapshotEnvelope {
    return this.state();
  }

  query(opts: DiagnosticsQueryOptions): DiagnosticsSnapshotEnvelope {
    const env = this.snapshot();
    const codes = opts.codes;
    const since = opts.sinceMs ?? 0;
    const filterRec = <T extends { at?: number; lastAt?: number }>(
      rec: Record<string, T[]>,
      pred: (v: T) => boolean,
    ): Record<string, T[]> => {
      const out: Record<string, T[]> = {};
      for (const [code, items] of Object.entries(rec)) {
        if (codes && !codes.includes(code as DiagnosticCode)) continue;
        const filtered = items.filter(pred);
        if (filtered.length) out[code] = filtered;
      }
      return out;
    };
    return {
      ...env,
      counters: filterRec(env.counters, c => (c.lastAt ?? 0) >= since),
      samples: filterRec(env.samples, s => (s.at ?? 0) >= since),
    };
  }

  reset(): void {
    this.pending.length = 0;
    this._counters.set({});
    this._samples.set({});
  }

  waitForFlush(): Promise<void> {
    if (this.pending.length === 0 && !this.flushScheduled) return Promise.resolve();
    if (!this.flushPromise) {
      this.flushPromise = new Promise<void>(resolve => {
        this.flushResolve = resolve;
      });
    }
    return this.flushPromise;
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => this.flush());
  }

  private flush(): void {
    const countersDraft: Record<string, Map<string, DiagnosticCounter>> = {};
    for (const [k, v] of Object.entries(this._counters())) countersDraft[k] = new Map(v);
    const samplesDraft: Record<string, DiagnosticSample[]> = { ...this._samples() };

    for (const emit of this.pending) {
      if (emit.kind === 'counter') {
        const map = countersDraft[emit.code] ?? new Map<string, DiagnosticCounter>();
        const key = dimensionsKey(emit.dimensions);
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          existing.lastAt = emit.at;
        } else {
          map.set(key, {
            code: emit.code,
            dimensions: emit.dimensions,
            count: 1,
            firstAt: emit.at,
            lastAt: emit.at,
          });
        }
        countersDraft[emit.code] = map;
      } else {
        const arr = samplesDraft[emit.code] ?? [];
        arr.push({ code: emit.code, at: emit.at, dimensions: emit.dimensions, value: emit.value });
        if (arr.length > StratosDiagnostics.SAMPLE_CAP_PER_FAMILY) {
          const dropped = arr.length - StratosDiagnostics.SAMPLE_CAP_PER_FAMILY;
          arr.splice(0, dropped);
          this.recordOverflowLocked(countersDraft, emit.code, dropped, emit.at);
        }
        samplesDraft[emit.code] = arr;
      }
    }
    this.pending.length = 0;
    this._counters.set(countersDraft);
    this._samples.set(samplesDraft);
    this.flushScheduled = false;
    const resolve = this.flushResolve;
    this.flushPromise = null;
    this.flushResolve = null;
    if (resolve) resolve();
  }

  private recordOverflowLocked(
    countersDraft: Record<string, Map<string, DiagnosticCounter>>,
    code: DiagnosticCode,
    dropped: number,
    at: number,
  ): void {
    const map = countersDraft['buffer-overflow'] ?? new Map<string, DiagnosticCounter>();
    const key = `code=${code}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += dropped;
      existing.lastAt = at;
    } else {
      map.set(key, {
        code: 'buffer-overflow',
        dimensions: { code },
        count: dropped,
        firstAt: at,
        lastAt: at,
      });
    }
    countersDraft['buffer-overflow'] = map;
  }

  private buildEnvelope(
    counters: Record<string, Map<string, DiagnosticCounter>>,
    samples: Record<string, DiagnosticSample[]>,
  ): DiagnosticsSnapshotEnvelope {
    const counterRec: Record<string, DiagnosticCounter[]> = {};
    for (const [code, map] of Object.entries(counters)) counterRec[code] = Array.from(map.values());
    return {
      version: 1,
      capturedAt: Date.now(),
      counters: counterRec,
      samples: { ...samples },
      snapshots: [],
    };
  }
}
