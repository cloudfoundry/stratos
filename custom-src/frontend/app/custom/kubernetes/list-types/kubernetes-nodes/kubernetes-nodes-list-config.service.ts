import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodeInfo, KubernetesNodesDataSource } from './kubernetes-nodes-data-source';

@Injectable()
export class KubernetesNodesListConfigService implements IListConfig<KubernetesNodeInfo> {
  nodesDataSource: KubernetesNodesDataSource;

  columns: Array<ITableColumn<KubernetesNodeInfo>> = [
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
    {
      columnId: 'capacity', headerCell: () => 'Capacity',
      cellComponent: KubernetesNodeCapacityComponent,
      cellFlex: '5',
    },
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
  getDataSource = () => this.nodesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private kubeId: BaseKubeGuid,
  ) {
    this.nodesDataSource = new KubernetesNodesDataSource(this.store, kubeId, this);
  }

}
