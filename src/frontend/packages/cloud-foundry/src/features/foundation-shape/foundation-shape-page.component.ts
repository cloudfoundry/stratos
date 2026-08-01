import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { EndpointsSignalService, InfoCardComponent } from '@stratosui/core';

import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../services/endpoint-data/endpoint-data.service';
import { computeSessionShape, SessionShape } from './session-shape';
import { ShapeDistCardComponent } from './shape-dist-card.component';
import { AgnosticExport, buildAgnosticExport, exportMarkdown } from './shape-export';
import {
  MeasuredEcosystem,
  MeasuredTotals,
  ShapeMeasureService,
  TOTALS_PROBES,
} from './shape-measure.service';
import { ShapeShareBarComponent, SharePart } from './shape-share-bar.component';

interface DrainStamp {
  fetchedAt: Date | null;
  stale: boolean;
}

export interface ShapeSection {
  guid: string;
  name: string;
  shape: SessionShape;
  totals: {
    orgs: number;
    /** null = spaces drain never ran this session (distinct from an empty foundation). */
    spaces: number | null;
    apps: number;
    routes: number;
    serviceInstances: number;
    serviceOfferings: number;
    servicePlans: number;
    serviceBrokers: number;
  };
  drains: { orgs: DrainStamp; spaces: DrainStamp; apps: DrainStamp };
  loading: boolean;
  /** At least one full drain landed, so the shape cards mean something. */
  hasDrains: boolean;
  /** The fast counts pass has run, so the totals row is real data. */
  countsLoaded: boolean;
  /** The services counts pass (a later, separate fetch) has run. */
  servicesCountsLoaded: boolean;
  /** The connected user is a CF admin on this endpoint — gates export. */
  admin: boolean;
}

/** Human age of a drain timestamp; the ambiguity note in one place. */
export const ageLabel = (date: Date | null, now: Date): string => {
  if (!date) {
    return 'not loaded';
  }
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
};

/**
 * Diagnostics sub-page: the foundation's shape (GH #5702) computed from data
 * this session has already loaded — the page itself issues no CF requests.
 * One section per connected CF endpoint, read through that endpoint's own
 * connection, so CF authorization scopes what each viewer sees.
 */
@Component({
  selector: 'app-foundation-shape-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, InfoCardComponent, ShapeDistCardComponent, ShapeShareBarComponent],
  templateUrl: './foundation-shape-page.component.html',
})
export class FoundationShapePageComponent implements OnDestroy {
  private readonly endpointsSignal = inject(EndpointsSignalService);
  private readonly registry = inject(EndpointDataRegistry);
  readonly measure = inject(ShapeMeasureService);

  readonly cfEndpoints = computed(() =>
    this.endpointsSignal.connectedEndpoints().filter(ep => ep.cnsi_type === 'cf' && !!ep.guid)
  );

  private readonly acquired = signal<ReadonlyMap<string, EndpointDataService>>(new Map());

  constructor() {
    // Acquire lazily as endpoints connect (covers late hydration); acquire()
    // also enqueues the endpoint's load, so visiting this page warms the
    // same cache every other CF page reads.
    effect(() => {
      const endpoints = this.cfEndpoints();
      untracked(() => {
        const next = new Map(this.acquired());
        let changed = false;
        for (const ep of endpoints) {
          const guid = ep.guid;
          if (guid && !next.has(guid)) {
            next.set(guid, this.registry.acquire(guid));
            changed = true;
          }
        }
        if (changed) {
          this.acquired.set(next);
        }
      });
    });
  }

  ngOnDestroy(): void {
    for (const guid of this.acquired().keys()) {
      this.registry.release(guid);
    }
  }

  readonly sections = computed<ShapeSection[]>(() => {
    const byGuid = this.acquired();
    return this.cfEndpoints()
      .map(ep => {
        const svc = ep.guid ? byGuid.get(ep.guid) : undefined;
        if (!svc) {
          return null;
        }
        const spacesLoaded = svc.spacesLastFetched() !== null;
        return {
          guid: ep.guid as string,
          name: ep.name ?? (ep.guid as string),
          shape: computeSessionShape(svc.orgs(), svc.spaces(), svc.apps()),
          totals: {
            orgs: svc.orgCount(),
            spaces: spacesLoaded ? svc.spaces().length : null,
            apps: svc.appCount(),
            routes: svc.routeCount(),
            serviceInstances: svc.serviceInstancesCount(),
            serviceOfferings: svc.serviceOfferingsCount(),
            servicePlans: svc.servicePlansCount(),
            serviceBrokers: svc.serviceBrokersCount(),
          },
          drains: {
            orgs: { fetchedAt: svc.orgsLastFetched(), stale: svc.orgsStale() },
            spaces: { fetchedAt: svc.spacesLastFetched(), stale: svc.spacesStale() },
            apps: { fetchedAt: svc.appsLastFetched(), stale: svc.appsStale() },
          },
          loading: svc.isLoadingDetails(),
          hasDrains:
            svc.orgsLastFetched() !== null || svc.spacesLastFetched() !== null || svc.appsLastFetched() !== null,
          countsLoaded: svc.lastFetched() !== null,
          servicesCountsLoaded: svc.servicesCountsLastFetched() !== null,
          admin: !!ep.user?.admin,
        };
      })
      .filter((section): section is ShapeSection => section !== null);
  });

  age(stamp: DrainStamp): string {
    return ageLabel(stamp.fetchedAt, new Date());
  }

  /** Occupied vs empty spaces, from the apps-per-space zero count. */
  occupancy(section: ShapeSection): { primary: SharePart; remainder: SharePart } | null {
    const d = section.shape.distributions.apps_per_space;
    if (!d) {
      return null;
    }
    return {
      primary: { label: 'occupied', value: d.n - d.zeros },
      remainder: { label: 'empty', value: d.zeros },
    };
  }

  started(section: ShapeSection): { primary: SharePart; remainder: SharePart } | null {
    const states = section.shape.composition.app_state;
    const total = Object.values(states).reduce((sum, count) => sum + count, 0);
    if (!total) {
      return null;
    }
    const startedCount = states['STARTED'] ?? 0;
    return {
      primary: { label: 'started', value: startedCount },
      remainder: { label: 'stopped', value: total - startedCount },
    };
  }

  stackChips(section: ShapeSection): { label: string; count: number }[] {
    return Object.entries(section.shape.composition.stacks_pinned_by_apps)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }

  ageOf(date: Date): string {
    return ageLabel(date, new Date());
  }

  /** Totals strip rows; null renders as a dash — a count that never loaded is not 0. */
  totalsRows(section: ShapeSection): { label: string; value: number | null }[] {
    const counted = (value: number): number | null => (section.countsLoaded ? value : null);
    const serviceCounted = (value: number): number | null => (section.servicesCountsLoaded ? value : null);
    return [
      { label: 'orgs', value: counted(section.totals.orgs) },
      { label: 'spaces', value: section.totals.spaces },
      { label: 'apps', value: counted(section.totals.apps) },
      { label: 'routes', value: counted(section.totals.routes) },
      { label: 'service instances', value: serviceCounted(section.totals.serviceInstances) },
      { label: 'offerings', value: serviceCounted(section.totals.serviceOfferings) },
      { label: 'plans', value: serviceCounted(section.totals.servicePlans) },
      { label: 'brokers', value: serviceCounted(section.totals.serviceBrokers) },
    ];
  }

  /** The anonymous projection (#5703) of everything this section has measured. */
  exportPayload(section: ShapeSection): AgnosticExport {
    return buildAgnosticExport({
      shape: section.shape,
      sessionTotals: section.totals,
      drains: {
        counts: section.countsLoaded,
        servicesCounts: section.servicesCountsLoaded,
        orgs: section.drains.orgs.fetchedAt !== null,
        spaces: section.drains.spaces.fetchedAt !== null,
        apps: section.drains.apps.fetchedAt !== null,
      },
      collectedAt: new Date(),
      measuredTotals: this.measuredTotals(section),
      measuredEcosystem: this.measuredEcosystem(section),
    });
  }

  downloadJson(section: ShapeSection): void {
    const payload = JSON.stringify(this.exportPayload(section), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    // Guid prefix keys multi-endpoint exports without leaking a name.
    anchor.download = `foundation-shape-${section.guid.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  copyMarkdown(section: ShapeSection): void {
    void navigator.clipboard.writeText(exportMarkdown(this.exportPayload(section)));
  }

  measuredTotals(section: ShapeSection): MeasuredTotals | undefined {
    return this.measure.totals().get(section.guid);
  }

  measuredEcosystem(section: ShapeSection): MeasuredEcosystem | undefined {
    return this.measure.ecosystem().get(section.guid);
  }

  measuring(section: ShapeSection, block: 'totals' | 'ecosystem'): boolean {
    return this.measure.inFlight().has(`${section.guid}:${block}`);
  }

  measuredTotalsRows(measured: MeasuredTotals): { label: string; count: number | null }[] {
    return TOTALS_PROBES.map(probe => ({ label: probe.label, count: measured.counts[probe.key] ?? null }));
  }

  /** Defined stacks annotated with whether any session app pins them. */
  stackDefinedChips(section: ShapeSection, measured: MeasuredEcosystem): { label: string; unused: boolean }[] {
    const pinned = section.shape.composition.stacks_pinned_by_apps;
    return measured.stacksDefined.map(name => ({ label: name, unused: !(name in pinned) }));
  }

  /** Defined buildpacks deduped to name × multiplicity (one entry per stack build). */
  buildpackDefinedChips(measured: MeasuredEcosystem): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const name of measured.buildpacksDefined) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  }

  concentrationTiles(section: ShapeSection): { headline: string; detail: string }[] {
    const shares = section.shape.distributions.top_share;
    const tiles: { headline: string; detail: string }[] = [];
    if (shares.apps_in_largest_space) {
      tiles.push({
        headline: `${(shares.apps_in_largest_space.fraction * 100).toFixed(1)}%`,
        detail: `of all apps sit in one space (${shares.apps_in_largest_space.largest_holds} apps)`,
      });
    }
    if (shares.apps_in_largest_org) {
      tiles.push({
        headline: `${(shares.apps_in_largest_org.fraction * 100).toFixed(1)}%`,
        detail: `of all apps sit in one org (${shares.apps_in_largest_org.largest_holds} apps)`,
      });
    }
    if (shares.spaces_in_largest_org) {
      tiles.push({
        headline: `${(shares.spaces_in_largest_org.fraction * 100).toFixed(1)}%`,
        detail: `of all spaces sit in one org (${shares.spaces_in_largest_org.largest_holds} spaces)`,
      });
    }
    return tiles;
  }
}
