import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesApp } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { AppLinkComponent } from './app-link/app-link.component';
import { KubeAppcreatedDateComponent } from './kube-appcreated-date/kube-appcreated-date.component';
import { KubernetesAppsDataSource } from './kubernetes-apps-data-source';

@Injectable()
export class KubernetesAppsListConfigService implements IListConfig<KubernetesApp> {
  AppsDataSource: KubernetesAppsDataSource;

  columns: Array<ITableColumn<KubernetesApp>> = [
    {
      columnId: 'name', headerCell: () => 'Release Name',
      cellComponent: AppLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'chartName', headerCell: () => 'Chart Name',
      cellDefinition: {
        getValue: (a) => a.chartName
      },
      sort: {
        type: 'sort',
        orderKey: 'chartName',
        field: 'chartName'
      },
      cellFlex: '5',
    },
    {
      columnId: 'status', headerCell: () => 'Status',
      cellDefinition: {
        getValue: (a) => a.status
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status'
      },
      cellFlex: '5',
    },
    {
      columnId: 'appVersion', headerCell: () => 'App Version',
      cellDefinition: {
        getValue: (a) => a.appVersion,
      },
      sort: {
        type: 'sort',
        orderKey: 'appVersion',
        field: 'appVersion'
      },
      cellFlex: '5',
    },
    {
      columnId: 'createdAt', headerCell: () => 'Created At',
      cellComponent: KubeAppcreatedDateComponent,
      sort: {
        type: 'sort',
        orderKey: 'createdAt',
        field: 'createdAt'
      },
      cellFlex: '5',
    },
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;

  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no applications'
  };

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.AppsDataSource;
  getMultiFiltersConfigs = () => [];
  getFilters = () => [];

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    this.AppsDataSource = new KubernetesAppsDataSource(store, kubeId, this);
  }

}
