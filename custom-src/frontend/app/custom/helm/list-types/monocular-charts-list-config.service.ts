import { ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { MonocularChart } from '../store/helm.types';
import { IListConfig, ListViewTypes, IListMultiFilterConfig } from '../../../shared/components/list/list.component.types';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { AppState } from '../../../../../store/src/app-state';
import { MonocularChartsDataSource } from './monocular-charts-data-source';
import { MonocularChartCardComponent } from './monocular-chart-card/monocular-chart-card.component';
import { ListView } from '../../../../../store/src/actions/list.actions';
import {  of as observableOf, BehaviorSubject, Observable } from 'rxjs';
import { EndpointsService } from '../../../core/endpoints.service';
import { map, filter } from 'rxjs/operators';

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

  pageSizeOptions = [9, 45, 90];
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
      select: new BehaviorSubject(this.route.snapshot.params['repo'])
    };
  }

  private helmRepositories(): Observable<any> {
    return this.endpointsService.endpoints$.pipe(
      map(endpoints => {
        const repos = [];
        Object.values(endpoints).forEach(ep => {
          if (ep.cnsi_type === 'helm') {
            repos.push({ label: ep.name, item: ep.name, value: ep.name});
          }
        });
        return repos;
      })
    );
  }
}
