import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPodCapacityComponent } from './kubernetes-pod-capacity/kubernetes-pod-capacity.component';
import { KubernetesPodInfo, KubernetesPodsDataSource } from './kubernetes-pods-data-source';

@Injectable()
export class KubernetesPodsListConfigService implements IListConfig<KubernetesPodInfo> {
  podsDataSource: KubernetesPodsDataSource;

  columns: Array<ITableColumn<KubernetesPodInfo>> = [
    {
      columnId: 'name', headerCell: () => 'ID',
      cellDefinition: {
        getValue: (row) => `${row.metadata.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    },
    // {
    //   columnId: 'capacity', headerCell: () => 'Capacity',
    //   cellComponent: KubernetesPodCapacityComponent,
    //   cellFlex: '5',
    // },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Nodes'
  };
  enableTextFilter = false;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.podsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private kubeId: BaseKubeGuid,
  ) {
    this.podsDataSource = new KubernetesPodsDataSource(this.store, kubeId, this);
  }

}
