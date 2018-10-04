import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  KubernetesNamespacesDataSource,
} from '../../../../../../../src/frontend/app/custom/kubernetes/list-types/kubernetes-namespaces/kubernetes-namespaces-data-source';
import { KubernetesNamespace } from '../../../../../../../src/frontend/app/custom/kubernetes/store/kube.types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceLinkComponent } from './kubernetes-namespace-link/kubernetes-namespace-link.component';


@Injectable()
export class KubernetesNamespacesListConfigService implements IListConfig<KubernetesNamespace> {
  podsDataSource: KubernetesNamespacesDataSource;

  columns: Array<ITableColumn<KubernetesNamespace>> = [
    {
      columnId: 'name', headerCell: () => 'ID',
      cellComponent: KubernetesNamespaceLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'status', headerCell: () => 'Status',
      cellDefinition: {
        getValue: (row) => `${row.status.phase}`
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status.phase'
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
  getDataSource = () => this.podsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private kubeId: BaseKubeGuid,
  ) {
    this.podsDataSource = new KubernetesNamespacesDataSource(this.store, kubeId, this);
  }

}
