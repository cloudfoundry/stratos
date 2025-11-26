import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { ITableColumn } from '../../../../core/src/shared/components/list/list-table/table.types';
import {
  type IListConfig,
  type IListMultiFilterConfig,
  ListViewTypes,
  type IGlobalListAction,
  type IMultiListAction,
  type IListAction,
} from '../../../../core/src/shared/components/list/list.component.types';
import type { ListView } from '../../../../store/src/actions/list.actions';
import type { AppState } from '../../../../store/src/public-api';
import { defaultHelmKubeListPageSize } from '../../kubernetes/list-types/kube-helm-list-types';
import { ChartsService } from '../monocular/shared/services/charts.service';
import type { MonocularChart } from '../store/helm.types';
import { MonocularChartCardComponent } from './monocular-chart-card/monocular-chart-card.component';
import { MonocularChartsDataSource } from './monocular-charts-data-source';

@Injectable({
  providedIn: 'root'
})
export class MonocularChartsListConfig implements IListConfig<MonocularChart> {
  dataSource!: MonocularChartsDataSource;
  isLocal = true;
  multiFilterConfigs!: IListMultiFilterConfig[];

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


  constructor(
    store: Store<AppState>,
    private chartsService: ChartsService
  ) {
    this.dataSource = new MonocularChartsDataSource(store, this);
  }

  getGlobalActions = (): IGlobalListAction<MonocularChart>[] => [];
  getMultiActions = (): IMultiListAction<MonocularChart>[] => [];
  getSingleActions = (): IListAction<MonocularChart>[] => [];
  getColumns = (): ITableColumn<MonocularChart>[] => this.columns;
  getDataSource = (): MonocularChartsDataSource => this.dataSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];

}
