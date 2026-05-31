import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { stratosMonocularEndpointGuid } from '../../../helm/monocular/stratos-monocular.helper';
import { MonocularVersion } from '../../../helm/store/helm.types';
import { firstNonDevelopmentVersion, isReleaseVersion } from './helm-release-versions.helpers';

// Minimal signal pipeline for the upgrade version picker: filter (release vs
// all) then client-side page. Deliberately order-preserving — version strings
// can't be naively string-sorted (`4.16.0` < `4.9.0`), so we keep the server's
// newest-first ordering rather than impose a sort. Mirrors the per-package
// KubeViewPipeline shape used elsewhere in the package, minus the sort stage.
class VersionViewPipeline {
  readonly filteredItems: Signal<MonocularVersion[]>;
  readonly pagedItems: Signal<MonocularVersion[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    items: Signal<MonocularVersion[]>,
    filter: Signal<(row: MonocularVersion) => boolean>,
    pageSize: Signal<number>,
    pageIndex: Signal<number>,
  ) {
    this.filteredItems = computed(() => items().filter(filter()));
    this.pagedItems = computed(() => {
      const size = pageSize();
      const idx = pageIndex();
      return this.filteredItems().slice(idx * size, idx * size + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => {
      const n = this.totalFilteredResults();
      const size = pageSize();
      return size > 0 ? Math.max(1, Math.ceil(n / size)) : 1;
    });
  }
}

// Signal-native replacement for ReleaseUpgradeVersionsListConfig +
// HelmReleaseVersionsDataSource. Drives the "pick a version" step of the
// helm upgrade-release stepper: lists every published chart version, lets the
// user filter to release-only (default) or all versions, and tracks the
// single radio selection. Provided at the component level — it carries
// per-upgrade state (repo/chart/current version/endpoint).
@Injectable()
export class HelmReleaseVersionsSignalConfigService {
  private readonly chartsService = inject(ChartsService);

  readonly pageSize: WritableSignal<number> = signal(10);
  readonly pageIndex: WritableSignal<number> = signal(0);

  // The release/all toggle is the only filter. Typed string | null so it can
  // back a signal-list dropdown's `selected` slot directly. Derived as a
  // computed so filtering stays synchronous — no effect timing to coordinate.
  // Anything other than 'all' (including null) means release-only.
  readonly versionType: WritableSignal<string | null> = signal('release');
  readonly filter: Signal<(v: MonocularVersion) => boolean> = computed(() =>
    this.versionType() === 'all'
      ? () => true
      : (v: MonocularVersion) => isReleaseVersion(v)
  );

  // Radio single-select: the row key (version string) currently chosen.
  readonly selectedKey: WritableSignal<string | null> = signal(null);

  private readonly _versions: WritableSignal<MonocularVersion[]> = signal([]);
  private readonly _loading: WritableSignal<boolean> = signal(false);

  private currentVersion = '';
  private repoName = '';
  private chartName = '';
  private endpoint = '';

  view!: VersionViewPipeline;

  getRowKey = (v: MonocularVersion): string => v.attributes.version;

  // The currently-running release is highlighted in the picker so the user
  // can see where they're upgrading from.
  isCurrent = (v: MonocularVersion): boolean => v.attributes.version === this.currentVersion;

  isLoading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  initialize(repoName: string, chartName: string, version: string, endpoint: string): void {
    this.repoName = repoName;
    this.chartName = chartName;
    this.currentVersion = version;
    this.endpoint = endpoint || stratosMonocularEndpointGuid;
    this.view = new VersionViewPipeline(this._versions, this.filter, this.pageSize, this.pageIndex);
  }

  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      const versions = await firstValueFrom(
        this.chartsService.getVersionsFromEndpoint(this.endpoint, this.repoName, this.chartName)
      );
      this._versions.set(versions ?? []);
      // Default the radio to the newest release (server order is newest-first);
      // falls back to the newest entry when only pre-releases are published.
      const first = firstNonDevelopmentVersion(this._versions());
      this.selectedKey.set(first ? this.getRowKey(first) : null);
    } finally {
      this._loading.set(false);
    }
  }

  selectedVersion(): MonocularVersion | undefined {
    const key = this.selectedKey();
    if (key == null) {
      return undefined;
    }
    return this._versions().find(v => this.getRowKey(v) === key);
  }

  clearFilters(): void {
    this.versionType.set('release');
    this.pageIndex.set(0);
  }
}
