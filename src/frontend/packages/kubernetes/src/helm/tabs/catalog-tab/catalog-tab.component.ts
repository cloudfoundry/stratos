import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, first, map, startWith } from 'rxjs/operators';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { SetClientFilter } from '../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../store/src/app-state';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { helmEntityCatalog } from '../../helm-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { MonocularChartsListConfig } from '../../list-types/monocular-charts-list-config.service';

const REPO_FILTER_NAME = 'repository';

@Component({
  selector: 'app-catalog-tab',
  templateUrl: './catalog-tab.component.html',
  styleUrls: ['./catalog-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: MonocularChartsListConfig,
  }]

})
export class CatalogTabComponent {

  public repos$: Observable<{
    artifactHubRepos: string[],
    stratosRepos: string[];
  }>;

  private searchReposSub = new BehaviorSubject('');
  public searchReposValue: string;

  public filteredRepo: string;

  public collapsed = true;
  public hide = true;

  constructor(private store: Store<AppState>, private activatedRoute: ActivatedRoute) {
    // Determine the starting state of the filter by repo section
    stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(entities => !!entities),
      first()
    ).subscribe(endpoints => {
      let stratosHelmEndpoints = 0;
      for (const ep of endpoints) {
        if (ep.cnsi_type !== HELM_ENDPOINT_TYPE) {
          continue;
        }

        stratosHelmEndpoints++;
        if (ep.sub_type === HELM_HUB_ENDPOINT_TYPE) {
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
      this.searchReposSub.asObservable()
    ]).pipe(
      distinctUntilChanged(),
      map(([repos, repoFilter]) => {
        const unique = repos.reduce((res, repo) => {
          const repoName = repo.attributes.repo.name;
          if (repoFilter && !repoName.startsWith(repoFilter)) {
            return res;
          }
          const uniqueRepos = repo.monocularEndpointId ? res.artifactHubRepos : res.stratosRepos;
          uniqueRepos[repoName] = true;
          return res;
        }, {
          artifactHubRepos: {},
          stratosRepos: {}
        });
        return {
          artifactHubRepos: Object.keys(unique.artifactHubRepos).sort((a, b) => a.localeCompare(b)),
          stratosRepos: Object.keys(unique.stratosRepos).sort((a, b) => a.localeCompare(b))
        };
      }),
      startWith(null)
    );

    helmEntityCatalog.chart.store.getPaginationMonitor().pagination$.pipe(
      first()
    ).subscribe(pagination => {
      const { repo } = this.activatedRoute.snapshot.params;
      if (repo &&  repo.length > 0) {
        this.filterCharts(repo);
      } else {
        this.filteredRepo = pagination.clientPagination?.filter?.items?.[REPO_FILTER_NAME];
      }
    });
  }

  /**
   * Filter the charts list for those in the given repo
   */
  public filterCharts(repoName: string) {
    this.filteredRepo = repoName;
    helmEntityCatalog.chart.store.getPaginationMonitor().pagination$.pipe(first()).subscribe(pagination => {
      const action = helmEntityCatalog.chart.actions.getMultiple();
      this.store.dispatch(new SetClientFilter(action, action.paginationKey, {
        ...pagination.clientPagination.filter,
        items: {
          [REPO_FILTER_NAME]: repoName,
        },
      }));
    });
  }

  /**
   * Filter the list of repos for those starting with the provided repo name
   */
  public searchRepos(repoName: string) {
    this.searchReposSub.next(repoName);
  }
}
