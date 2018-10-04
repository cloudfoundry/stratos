import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesAppsDataSource } from './kubernetes-apps-data-source';
import { KubernetesApp } from '../../store/kube.types';
import { AppLinkComponent } from './app-link/app-link.component';
import { KubeAppcreatedDateComponent } from './kube-appcreated-date/kube-appcreated-date.component';
import { KubeAppChartNameComponent } from './kube-app-chart-name/kube-app-chart-name.component';
import { KubeAppVersionComponent } from './kube-app-version/kube-app-version.component';

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
      cellComponent: KubeAppChartNameComponent,
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
      columnId: 'version', headerCell: () => 'Version',
      cellComponent: KubeAppVersionComponent,
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

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;

  enableTextFilter = false;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.AppsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private kubeId: BaseKubeGuid,
  ) {
    this.AppsDataSource = new KubernetesAppsDataSource(this.store, kubeId, this);
  }

}
