import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ITableColumn } from '@stratosui/core';
import {
  type IListAction,
  type IListConfig,
  type IListMultiFilterConfig,
  ListViewTypes,
  type IGlobalListAction,
  type IMultiListAction,
} from '@stratosui/core';
import { formatDistance } from 'date-fns';
import { type Observable, of } from 'rxjs';

import type { ListView } from '../../../../store/src/actions/list.actions';
import type { AppState } from '../../../../store/src/public-api';
import { defaultHelmKubeListPageSize } from '../../kubernetes/list-types/kube-helm-list-types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../services/kubernetes.analysis.service';
import type { AnalysisReport } from '../store/kube.types';
import { AnalysisReportsDataSource } from './analysis-reports-list-source';
import { AnalysisStatusCellComponent } from './analysis-status-cell/analysis-status-cell.component';

@Injectable({
  providedIn: 'root'
})
export class AnalysisReportsListConfig implements IListConfig<AnalysisReport> {
  AppsDataSource: AnalysisReportsDataSource;
  isLocal = true;
  multiFilterConfigs: IListMultiFilterConfig[];

  guid: string;

  columns: Array<ITableColumn<AnalysisReport>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row: AnalysisReport) => row.name,
        getLink: (row: AnalysisReport) => row.status === 'completed' ? `/kubernetes/${this.guid}/analysis/report/${row.id}` : null
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2',
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        getValue: (row: AnalysisReport) => row.type.charAt(0).toUpperCase() + row.type.substring(1)
      },
      sort: {
        type: 'sort',
        orderKey: 'type',
        field: 'type'
      },
      cellFlex: '1'
    },
    {
      columnId: 'age',
      headerCell: () => 'Age',
      cellDefinition: {
        getValue: (row: AnalysisReport) => {
          return formatDistance(new Date(row.created), new Date());
        }
      },
      sort: {
        type: 'sort',
        orderKey: 'age',
        field: 'created'
      },
      cellFlex: '1'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellComponent: AnalysisStatusCellComponent,
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status'
      },
      cellFlex: '1'
    }
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  defaultView = 'table' as ListView;

  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no Analysis Reports'
  };

  constructor(
    store: Store<AppState>,
    kubeEndpointService: KubernetesEndpointService,
    private analysisService: KubernetesAnalysisService,
    ngZone: NgZone,
  ) {
    this.guid = kubeEndpointService.baseKube.guid;
    this.AppsDataSource = new AnalysisReportsDataSource(store, this, kubeEndpointService, ngZone);
  }

  private listActionDelete: IListAction<AnalysisReport> = {
    action: (item: AnalysisReport) => this.analysisService.delete(item.endpoint, item),
    label: 'Delete',
    icon: 'delete',
    description: ``,
    createEnabled: (_row$: Observable<AnalysisReport>) => of(true)
  };

  private singleActions = [
    this.listActionDelete,
  ];

  getGlobalActions = (): IGlobalListAction<AnalysisReport>[] => [];
  getMultiActions = (): IMultiListAction<AnalysisReport>[] => [];
  getSingleActions = (): IListAction<AnalysisReport>[] => this.singleActions;
  getColumns = (): ITableColumn<AnalysisReport>[] => this.columns;
  getDataSource = (): AnalysisReportsDataSource => this.AppsDataSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
}
