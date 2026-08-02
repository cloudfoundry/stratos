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
import writeXlsxFile from 'write-excel-file/browser';

import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../services/endpoint-data/endpoint-data.service';
import { computeSessionShape } from './session-shape';
import { ShapeCompareCardComponent } from './shape-compare-card.component';
import { ShapeDistCardComponent } from './shape-dist-card.component';
import { AgnosticExport, exportMarkdown } from './shape-export';
import { buildShapeWorkbook } from './shape-export-xlsx';
import {
  MeasuredEcosystem,
  MeasuredTotals,
  ShapeMeasureService,
  TOTALS_PROBES,
} from './shape-measure.service';
import { DrainStamp, sectionExportPayload, ShapeSection } from './shape-section';
import { ShapeShareBarComponent, SharePart } from './shape-share-bar.component';

export type { ShapeSection } from './shape-section';

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
  imports: [DecimalPipe, InfoCardComponent, ShapeCompareCardComponent, ShapeDistCardComponent, ShapeShareBarComponent],
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
  occupancy(section: ShapeSection): SharePart[] | null {
    const d = section.shape.distributions.apps_per_space;
    if (!d) {
      return null;
    }
    return [
      { label: 'occupied', value: d.n - d.zeros },
      { label: 'empty', value: d.zeros },
    ];
  }

  /** One part per state actually present — nothing gets lumped into a guess. */
  appStateParts(section: ShapeSection): SharePart[] | null {
    const states = section.shape.composition.app_state;
    const known = ['STARTED', 'STOPPED'];
    const ordered = [
      ...known.filter(state => state in states),
      ...Object.keys(states).filter(state => !known.includes(state)).sort(),
    ];
    const parts = ordered.map(state => ({ label: state, value: states[state] }));
    return parts.length ? parts : null;
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
    return sectionExportPayload(section, this.measuredTotals(section), this.measuredEcosystem(section));
  }

  // <endpoint>-foundational-shape-<mode>-<date>: the name says which
  // endpoint it came from and that the content is anonymized (a future
  // detail-mode export will say "detail" in the same slot).
  private exportFileName(section: ShapeSection, extension: 'json' | 'xlsx'): string {
    const endpoint = section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${endpoint}-foundational-shape-anonymous-${new Date().toISOString().slice(0, 10)}.${extension}`;
  }

  downloadJson(section: ShapeSection): void {
    const payload = JSON.stringify(this.exportPayload(section), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.exportFileName(section, 'json');
    anchor.click();
    URL.revokeObjectURL(url);
  }

  downloadXlsx(section: ShapeSection): void {
    const sheets = buildShapeWorkbook(this.exportPayload(section))
      .map(({ name, rows }) => ({ sheet: name, data: rows }));
    void writeXlsxFile(sheets).toFile(this.exportFileName(section, 'xlsx'));
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

  /** Always all three tiles — a missing one shows as such instead of vanishing. */
  concentrationTiles(section: ShapeSection): { headline: string | null; detail: string }[] {
    const shares = section.shape.distributions.top_share;
    const tile = (
      share: { largest_holds: number; fraction: number } | null,
      story: (holds: number) => string,
      emptyStory: string
    ) =>
      share
        ? { headline: `${(share.fraction * 100).toFixed(1)}%`, detail: story(share.largest_holds) }
        : { headline: null, detail: `${emptyStory} — no data` };
    return [
      tile(shares.apps_in_largest_space, holds => `of all apps sit in one space (${holds} apps)`, 'apps in one space'),
      tile(shares.apps_in_largest_org, holds => `of all apps sit in one org (${holds} apps)`, 'apps in one org'),
      tile(shares.spaces_in_largest_org, holds => `of all spaces sit in one org (${holds} spaces)`, 'spaces in one org'),
    ];
  }
}
