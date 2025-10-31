import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, startWith } from 'rxjs/operators';

import { ListComponent } from '@stratosui/core';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { SetClientFilter } from '../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { helmEntityCatalog } from '../../helm-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { MonocularChartsListConfig } from '../../list-types/monocular-charts-list-config.service';
import { CustomFormFieldComponent } from '../../../../../core/src/shared/components/custom-form-field/custom-form-field.component';

const REPO_FILTER_NAME = 'repository';

@Component({
  selector: 'app-catalog-tab',
  templateUrl: './catalog-tab.component.html',
  styleUrls: ['./catalog-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: MonocularChartsListConfig,
  }],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomFormFieldComponent,
    ListComponent
  ]
})
export class CatalogTabComponent implements OnDestroy {

  public repos$: Observable<{
    artifactHubRepos: string[],
    stratosRepos: string[];
  }>;

  private searchRepos = signal<string>('');
  public searchReposValue: string;

  public filteredRepo: string;

  public collapsed = true;
  public hide = true;

  private initStateSet = false;
  private sub: Subscription;
  private store = inject(Store<AppState>);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    // Determine the starting state of the filter by repo section
    stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(entities => !!entities),
      first()
    ).subscribe((endpoints: unknown[]) => {
      let stratosHelmEndpoints = 0;
      for (const ep of endpoints) {
        const endpoint = ep as EndpointModel;
        if (endpoint.cnsi_type !== HELM_ENDPOINT_TYPE) {
          continue;
        }

        stratosHelmEndpoints++;
        if (endpoint.sub_type === HELM_HUB_ENDPOINT_TYPE) {
          // Always show the filter if there's artifact hub attached
          this.collapsed = false;
          this.hide = false;
          return;
        }
      }
      this.hide = stratosHelmEndpoints === 1;
    });

    // Collect all unique repos in stratos and artifact hub repos
    this.repos$ = combineLatest([
      helmEntityCatalog.chart.store.getPaginationMonitor().currentPage$,
      toObservable(this.searchRepos)
    ]).pipe(
      distinctUntilChanged(),
      map(([repos, repoFilter]: [unknown[], string]) => {
        const unique = (repos || []).reduce<{ artifactHubRepos: Record<string, boolean>; stratosRepos: Record<string, boolean> }>(
          (res, repo: any) => {
            const repoName = repo?.attributes?.repo?.name;
            if (!repoName || (repoFilter && !repoName.startsWith(repoFilter))) {
              return res;
            }
            const uniqueRepos = repo.monocularEndpointId ? res.artifactHubRepos : res.stratosRepos;
            uniqueRepos[repoName] = true;
            return res;
          },
          { artifactHubRepos: {}, stratosRepos: {} }
        );
        return {
          artifactHubRepos: Object.keys(unique.artifactHubRepos).sort((a: string, b: string) => a.localeCompare(b)),
          stratosRepos: Object.keys(unique.stratosRepos).sort((a: string, b: string) => a.localeCompare(b))
        };
      }),
      startWith({ artifactHubRepos: [], stratosRepos: [] })
    );

    const { repo: repoFromRoute } = this.activatedRoute.snapshot.params;
    const repoFromStore$ = helmEntityCatalog.chart.store.getPaginationMonitor().pagination$.pipe(
      map(pagination => pagination.clientPagination?.filter?.items?.[REPO_FILTER_NAME])
    );

    // Set the initial state... and watch for changes (aka reset filters button)
    this.sub = repoFromStore$.subscribe((repoFromStore: string) => {
      // Only apply repo from url on first load (and if we have one)
      if (!this.initStateSet && repoFromRoute && repoFromRoute.length > 0) {
        this.filterCharts(repoFromRoute);
      } else if (this.filteredRepo !== repoFromStore) {
        this.filteredRepo = repoFromStore;
      }
      this.initStateSet = true;
    });
  }

  /**
   * Filter the charts list for those in the given repo
   */
  public filterCharts(repoName: string) {
    this.filteredRepo = repoName;
    helmEntityCatalog.chart.store.getPaginationMonitor().pagination$.pipe(first()).subscribe((pagination: any) => {
      const action = helmEntityCatalog.chart.actions.getMultiple();
      this.store.dispatch(new SetClientFilter(action, action.paginationKey, {
        string: pagination.clientPagination?.filter?.string ?? '',
        ...(pagination.clientPagination?.filter ?? {}),
        items: {
          ...(pagination.clientPagination?.filter?.items ?? {}),
          [REPO_FILTER_NAME]: repoName,
        },
      }));
    });
  }

  /**
   * Filter the list of repos for those starting with the provided repo name
   */
  public searchReposChange(repoName: string) {
    this.searchRepos.set(repoName);
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
