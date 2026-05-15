import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { filter, map, publishReplay, refCount, take } from 'rxjs/operators';

import { CustomFormFieldComponent } from '../../../../../core/src/shared/components/custom-form-field/custom-form-field.component';
import { SignalListComponent, SignalListConfig } from '../../../../../core/src/shared/components/signal-list/signal-list.component';
import { EndpointModel, EndpointsDataService } from '../../../../../store/src/public-api';
import { MonocularChart } from '../../../services/endpoint-data/kube-types';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE, HELM_REPO_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { MonocularChartsSignalConfigService } from '../../list-types/monocular-charts-signal-config.service';
import { ChartItemComponent } from '../../monocular/chart-item/chart-item.component';

// Signal-native catalog tab. Replaces the legacy MonocularChartsListConfig
// + ngrx pagination pipeline with MonocularChartsSignalConfigService driving
// <app-signal-list>. The per-repo sidebar is preserved and now writes
// the signal-config's `repositoryFilter`.

@Component({
  selector: 'app-catalog-tab',
  templateUrl: './catalog-tab.component.html',
  styleUrls: ['./catalog-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CustomFormFieldComponent,
    SignalListComponent,
    ChartItemComponent,
  ],
})
export class CatalogTabComponent implements OnDestroy {

  // Sidebar visibility / collapse state — preserved from the legacy
  // component. `hide` flips off when there is exactly one helm endpoint
  // (no need for repo filtering); `collapsed` is the user-toggle.
  public collapsed = true;
  public hide = true;

  // Two-way ngModel target for the sidebar's repo-name search input.
  public searchReposValue = '';
  private readonly searchRepos: WritableSignal<string> = signal('');

  private sub: Subscription | undefined;
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly endpointsData = inject(EndpointsDataService);
  private readonly injector = inject(Injector);
  readonly signalConfig = inject(MonocularChartsSignalConfigService);

  // W36-B Wave 3: Pre-built signal-bridge over EndpointsDataService.
  // Reused by both the artifactHubAndHelmRepoTypes$ stream and the
  // computeSidebarVisibility() one-shot read so we don't recreate
  // toObservable() on every change-detection cycle.
  private readonly endpoints$ = toObservable(this.endpointsData.endpointsList, { injector: this.injector });

  readonly listConfig: WritableSignal<SignalListConfig<MonocularChart> | undefined> = signal(undefined);

  // Drives the chart-item card layout: when both Artifact Hub AND a
  // classic helm repo are connected, chart-item shows the source-repo
  // badge to disambiguate. Mirrors the legacy MonocularChartCardComponent
  // ctor so the visuals stay identical.
  readonly artifactHubAndHelmRepoTypes$: Observable<boolean> = this.endpoints$.pipe(
      filter(endpoints => !!endpoints),
      take(1),
      map(endpoints => {
        let haveArtifactHub = false;
        let haveHelmRepo = false;
        for (const ep of endpoints as EndpointModel[]) {
          if (ep.cnsi_type !== HELM_ENDPOINT_TYPE) continue;
          if (ep.sub_type === HELM_HUB_ENDPOINT_TYPE) haveArtifactHub = true;
          else if (ep.sub_type === HELM_REPO_ENDPOINT_TYPE) haveHelmRepo = true;
        }
        return haveArtifactHub && haveHelmRepo;
      }),
      publishReplay(1),
      refCount(),
    );

  // Repo-name lists filtered by the sidebar search.
  readonly stratosRepos: Signal<string[]> = computed(() => {
    const q = this.searchRepos().toLowerCase();
    return this.signalConfig.stratosRepos().filter(n => !q || n.toLowerCase().startsWith(q));
  });
  readonly artifactHubRepos: Signal<string[]> = computed(() => {
    const q = this.searchRepos().toLowerCase();
    return this.signalConfig.artifactHubRepos().filter(n => !q || n.toLowerCase().startsWith(q));
  });

  // The current selected repo (drives the .font-bold styling on the link).
  get filteredRepo(): string { return this.signalConfig.repositoryFilter(); }

  constructor() {
    // Determine sidebar visibility — match the legacy logic. Hide the
    // sidebar entirely if there is exactly one helm endpoint (and it's
    // not Artifact Hub).
    void this.computeSidebarVisibility();

    this.signalConfig.initialize();
    void this.signalConfig.loadAll();

    // Apply repo filter from the route param if provided.
    const repoFromRoute: string | undefined = this.activatedRoute.snapshot.params?.repo;
    if (repoFromRoute) {
      this.signalConfig.repositoryFilter.set(repoFromRoute);
    }

    this.listConfig.set({
      pagedItems: this.signalConfig.view.pagedItems,
      totalFilteredResults: this.signalConfig.view.totalFilteredResults,
      totalPages: this.signalConfig.view.totalPages,
      pageIndex: this.signalConfig.pageIndex,
      pageSize: this.signalConfig.pageSize,
      isAnyLoading: this.signalConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      pageSizeOptions: { table: [10, 25, 50, 100], card: [9, 45, 90] },
      columns: [
        {
          header: 'Name', key: 'name',
          sortField: (c: MonocularChart) => (c.name ?? '').toLowerCase(),
          kind: 'link',
          link: (c: MonocularChart) => buildChartRoute(c),
          render: (c: MonocularChart) => c.name,
          widthHint: '20rem',
        },
        {
          header: 'Description', key: 'description',
          sortField: (c: MonocularChart) => (c.attributes?.description ?? '').toLowerCase(),
          kind: 'text',
          render: (c: MonocularChart) => c.attributes?.description ?? '',
        },
        {
          header: 'Repository', key: 'repository',
          sortField: (c: MonocularChart) => (c.attributes?.repo?.name ?? '').toLowerCase(),
          kind: 'text',
          render: (c: MonocularChart) => c.attributes?.repo?.name ?? '',
          widthHint: '14rem',
        },
      ],
      getRowKey: (c: MonocularChart) => c.id,
      emptyMessage: 'There are no charts',
      emptyFilterMessage: 'No charts match the current filter',
      loadingMessage: 'Loading charts…',
      nameFilter: this.signalConfig.nameFilter,
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => this.signalConfig.clearFilters(),
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });
  }

  private async computeSidebarVisibility(): Promise<void> {
    try {
      const endpoints = await firstValueFrom(
        this.endpoints$.pipe(
          filter(e => !!e),
          take(1),
        ),
      ) as EndpointModel[];
      let stratosHelmEndpoints = 0;
      for (const ep of endpoints) {
        if (ep.cnsi_type !== HELM_ENDPOINT_TYPE) continue;
        stratosHelmEndpoints++;
        if (ep.sub_type === HELM_HUB_ENDPOINT_TYPE) {
          // Artifact Hub attached — always show the filter sidebar.
          this.collapsed = false;
          this.hide = false;
          return;
        }
      }
      this.hide = stratosHelmEndpoints === 1;
    } catch {
      this.hide = true;
    }
  }

  filterCharts(repoName?: string): void {
    this.signalConfig.repositoryFilter.set(repoName ?? '');
  }

  searchReposChange(repoName: string): void {
    this.searchRepos.set(repoName ?? '');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

// Chart route builder — preserves the legacy `getChartSummaryRoute`
// shape: `/monocular/charts/{monocularEndpointId|stratos}/{repo}/{chart}`.
// The route itself still resolves through the existing chart-details
// component, which is unchanged in wave-2.
function buildChartRoute(c: MonocularChart): string[] {
  const endpointId = c.monocularEndpointId ?? 'stratos';
  const repo = c.attributes?.repo?.name ?? '';
  const name = c.attributes?.name ?? c.name ?? '';
  return ['/monocular/charts', endpointId, repo, name];
}
