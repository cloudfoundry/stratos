import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { EndpointModel } from '@stratosui/store';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { EndpointsSignalService } from '../../../core/signals/endpoints-signal.service';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { HeapHeadroomMeterComponent } from './heap-headroom-meter.component';
import {
  estimateFootprint,
  formatBytes,
  HeapInfo,
  rateRisk,
  readHeap,
  RiskLevel,
} from '../diagnostics-data/entity-footprint';

/** Entity types probed per endpoint: footprint key + display label + jetstream resource path. */
const PROBES: { key: string; label: string; path: string }[] = [
  { key: 'user', label: 'Users', path: 'users' },
  { key: 'organization', label: 'Organizations', path: 'orgs' },
  { key: 'space', label: 'Spaces', path: 'spaces' },
  { key: 'application', label: 'Applications', path: 'apps' },
  { key: 'route', label: 'Routes', path: 'routes' },
  { key: 'serviceInstance', label: 'Service Instances', path: 'service_instances' },
];

/** Per-entity probe result: count, or null when the probe failed. */
type EndpointCounts = Record<string, number | null>;

interface CountRow {
  key: string;
  label: string;
  /** undefined = probe in flight; null = probe failed. */
  count: number | null | undefined;
  footprint: string | null;
  risk: RiskLevel | null;
}

interface EndpointView {
  guid: string;
  name: string;
  rows: CountRow[];
  /** Successfully probed counts only — feeds the headroom meter. */
  counts: Record<string, number>;
  totalFootprint: string;
  totalRisk: RiskLevel;
  usersHighRisk: boolean;
}

/**
 * Diagnostics sub-page listing per-endpoint entity counts with estimated
 * client-memory footprints and heap-relative risk ratings (GH issue #5391).
 *
 * Counts come from the jetstream `?return=counts` fast paths (per_page=1,
 * totalResults only) so probing is cheap even on very large foundations.
 */
@Component({
  selector: 'app-diagnostic-counts-page',
  templateUrl: './diagnostic-counts-page.component.html',
  standalone: true,
  imports: [CommonModule, InfoCardComponent, HeapHeadroomMeterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticCountsPageComponent {
  private http = inject(HttpClient);
  private endpointsSignal = inject(EndpointsSignalService);

  /** Connected Cloud Foundry endpoints only. */
  readonly cfEndpoints = computed(() =>
    this.endpointsSignal.connectedEndpoints().filter(ep => ep.cnsi_type === 'cf' && !!ep.guid)
  );

  readonly heap = signal<HeapInfo>(readHeap());
  private readonly counts = signal<Record<string, EndpointCounts>>({});

  readonly heapLine = computed(() => {
    const heap = this.heap();
    const limit = formatBytes(heap.limitBytes);
    if (heap.usedBytes !== null) {
      return `Heap: ${formatBytes(heap.usedBytes)} used of ${limit} limit (performance.memory)`;
    }
    return `Heap: assuming a ${limit} budget (fixed budget; performance.memory unavailable)`;
  });

  readonly endpointViews = computed<EndpointView[]>(() => {
    const heap = this.heap();
    const countsByEndpoint = this.counts();
    return this.cfEndpoints().map(ep => {
      const guid = ep.guid ?? '';
      return this.buildView(guid, ep.name ?? guid, countsByEndpoint[guid], heap);
    });
  });

  constructor() {
    // Probe whenever the connected-CF-endpoint set changes (covers late hydration).
    effect(() => {
      const endpoints = this.cfEndpoints();
      untracked(() => this.probeAll(endpoints));
    });
  }

  refresh(): void {
    this.probeAll(this.cfEndpoints());
  }

  riskChipClass(risk: RiskLevel | null): string {
    switch (risk) {
      case 'low':
        return 'bg-success-shade-100 text-success-shade-700 dark:bg-success-shade-900/30 dark:text-success-shade-300';
      case 'medium':
        return 'bg-warning-shade-100 text-warning-shade-700 dark:bg-warning-shade-900/30 dark:text-warning-shade-300';
      case 'high':
        return 'bg-danger-shade-100 text-danger-shade-700 dark:bg-danger-shade-900/30 dark:text-danger-shade-300';
      default:
        return '';
    }
  }

  riskLabel(risk: RiskLevel | null): string {
    if (!risk) {
      return '';
    }
    return risk.charAt(0).toUpperCase() + risk.slice(1);
  }

  private probeAll(endpoints: EndpointModel[]): void {
    this.heap.set(readHeap());
    this.counts.set({});
    for (const ep of endpoints) {
      const guid = ep.guid;
      if (!guid) {
        continue;
      }
      const probes: Record<string, Observable<number | null>> = {};
      for (const probe of PROBES) {
        probes[probe.key] = this.http
          .get<{ totalResults: number }>(`/pp/v1/cf/${probe.path}/${guid}?return=counts`)
          .pipe(
            map(r => r?.totalResults ?? 0),
            catchError(() => of(null))
          );
      }
      forkJoin(probes).subscribe(result => {
        this.counts.update(all => ({ ...all, [guid]: result }));
      });
    }
  }

  private buildView(
    guid: string,
    name: string,
    counts: EndpointCounts | undefined,
    heap: HeapInfo
  ): EndpointView {
    const knownCounts: Record<string, number> = {};
    const rows: CountRow[] = PROBES.map(probe => {
      const count = counts ? counts[probe.key] : undefined;
      if (typeof count !== 'number') {
        return { key: probe.key, label: probe.label, count, footprint: null, risk: null };
      }
      knownCounts[probe.key] = count;
      const bytes = estimateFootprint({ [probe.key]: count });
      return {
        key: probe.key,
        label: probe.label,
        count,
        footprint: formatBytes(bytes),
        risk: rateRisk(bytes, heap),
      };
    });
    const totalBytes = estimateFootprint(knownCounts);
    const usersRow = rows.find(row => row.key === 'user');
    return {
      guid,
      name,
      rows,
      counts: knownCounts,
      totalFootprint: formatBytes(totalBytes),
      totalRisk: rateRisk(totalBytes, heap),
      usersHighRisk: usersRow?.risk === 'high',
    };
  }
}
