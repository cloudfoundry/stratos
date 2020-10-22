import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { SetClientFilter } from '../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../store/src/app-state';
import { helmEntityCatalog } from '../../helm-entity-catalog';
import { MonocularChartsListConfig } from '../../list-types/monocular-charts-list-config.service';

@Component({
  selector: 'app-catalog-tab',
  templateUrl: './catalog-tab.component.html',
  styleUrls: ['./catalog-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: MonocularChartsListConfig,
  }]

})
export class CatalogTabComponent implements OnInit {


  constructor(private store: Store<AppState>) {
    this.repos$ = combineLatest([
      helmEntityCatalog.chart.store.getPaginationMonitor().currentPage$, // TODO: RC get list from table (to include chart name filter)
      this.filterRepoSub.asObservable()
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
  }

  repos$: Observable<any>;
  filterRepoSub = new BehaviorSubject('');
  bar; // TODO: RC

  ngOnInit(): void {

  }

  public filterCharts(repoName: string) {
    const action = helmEntityCatalog.chart.actions.getMultiple();
    this.store.dispatch(new SetClientFilter(action, action.paginationKey, {
      items: {
        repository: repoName,
      },
      string: '' // TODO: RC ensure this isn't overwritten, else provide existing
    }));
  }

  public filterRepo(repoEVent: string) {
    console.log(repoEVent);
    this.filterRepoSub.next(repoEVent);
  }

}

