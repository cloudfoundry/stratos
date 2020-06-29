import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes,
} from '../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../store/src/actions/list.actions';
import { AppState } from '../../../../../store/src/app-state';
import { defaultHelmKubeListPageSize } from '../../kubernetes/list-types/kube-helm-list-types';
import { MonocularChart } from '../store/helm.types';
import { MonocularChartCardComponent } from './monocular-chart-card/monocular-chart-card.component';
import { MonocularChartsDataSource } from './monocular-charts-data-source';

@Injectable()
export class MonocularChartsListConfig implements IListConfig<MonocularChart> {
  AppsDataSource: MonocularChartsDataSource;
  isLocal = true;
  multiFilterConfigs: IListMultiFilterConfig[];

  columns: Array<ITableColumn<MonocularChart>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => row.name,
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2',
    },
    {
      columnId: 'description', headerCell: () => 'Description',
      cellDefinition: {
        getValue: (row) => row.attributes.description,
      },
      sort: {
        type: 'sort',
        orderKey: 'description',
        field: 'attributes.description'
      },
      cellFlex: '5',
    },
    {
      columnId: 'repository', headerCell: () => 'Repository',
      cellDefinition: {
        getValue: (row) => row.attributes.repo.name
      },
      sort: {
        type: 'sort',
        orderKey: 'repository',
        field: 'attributes.repo.name'
      },
      cellFlex: '2',
    },
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  cardComponent = MonocularChartCardComponent;

  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no charts'
  };

  constructor(
    store: Store<AppState>,
    private endpointsService: EndpointsService,
    private route: ActivatedRoute,
  ) {
    this.AppsDataSource = new MonocularChartsDataSource(store, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.AppsDataSource;
  getMultiFiltersConfigs = () => [this.createRepositoryFilterConfig()];

  private createRepositoryFilterConfig(): IListMultiFilterConfig {
    return {
      key: 'repository',
      label: 'Repository',
      allLabel: 'All Repositories',
      list$: this.helmRepositories(),
      loading$: observableOf(false),
      select: new BehaviorSubject(this.route.snapshot.params.repo)
    };
  }

  private helmRepositories(): Observable<any> {
    return this.endpointsService.endpoints$.pipe(
      map(endpoints => {
        const repos = [];
        Object.values(endpoints).forEach(ep => {
          if (ep.cnsi_type === 'helm') {
            repos.push({ label: ep.name, item: ep.name, value: ep.name });
          }
        });
        return repos;
      })
    );
  }
}
