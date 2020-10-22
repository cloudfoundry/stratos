import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { ITableColumn } from '../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes,
} from '../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../store/src/actions/list.actions';
import { AppState } from '../../../../store/src/public-api';
import { defaultHelmKubeListPageSize } from '../../kubernetes/list-types/kube-helm-list-types';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';
import { ChartsService } from '../monocular/shared/services/charts.service';
import { MonocularChart } from '../store/helm.types';
import { MonocularChartCardComponent } from './monocular-chart-card/monocular-chart-card.component';
import { MonocularChartsDataSource } from './monocular-charts-data-source';

@Injectable()
export class MonocularChartsListConfig implements IListConfig<MonocularChart> {
  dataSource: MonocularChartsDataSource;
  isLocal = true;
  multiFilterConfigs: IListMultiFilterConfig[];

  columns: Array<ITableColumn<MonocularChart>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: row => row.name,
        getLink: row => this.chartsService.getChartSummaryRoute(
          row.attributes.repo.name,
          row.name,
          null,
          null,
          row
        ),
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

  private initialised: Observable<boolean>;

  constructor(
    store: Store<AppState>,
    private endpointsService: EndpointsService,
    private route: ActivatedRoute,
    private chartsService: ChartsService
  ) {

    this.initialised = endpointsService.endpoints$.pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => {
        this.dataSource = new MonocularChartsDataSource(store, this, endpoints);
        return true;
      }),
    );
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
  // getMultiFiltersConfigs = () => [this.createRepositoryFilterConfig()]; // TODO: RC remove associated bits n bobs
  getMultiFiltersConfigs = () => [];
  getInitialised = () => this.initialised;

  private createRepositoryFilterConfig(): IListMultiFilterConfig {
    return {
      key: 'repository',
      label: 'Source',
      allLabel: 'All Sources',
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
          if (ep.cnsi_type === HELM_ENDPOINT_TYPE) {
            repos.push({ label: ep.name, item: ep.name, value: ep.name });
          }
        });
        return repos;
      })
    );
  }
}
