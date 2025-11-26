import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  createTableColumnFavorite,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-favorite/table-cell-favorite.component';
import type { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { type IListConfig, ListViewTypes, type IGlobalListAction, type IMultiListAction, type IListAction, type IListMultiFilterConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import type { AppState } from '../../../../../store/src/public-api';
import { type IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import type { KubernetesNamespace } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn } from '../kube-list.helper';
import { KUBERNETES_ENDPOINT_TYPE, kubernetesNamespacesEntityType } from './../../kubernetes-entity-factory';
import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count/kube-namespace-pod-count.component';
import { KubernetesNamespaceLinkComponent } from './kubernetes-namespace-link/kubernetes-namespace-link.component';
import { KubernetesNamespacesDataSource } from './kubernetes-namespaces-data-source';


@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespacesListConfigService implements IListConfig<KubernetesNamespace> {
  podsDataSource: KubernetesNamespacesDataSource;

  columns: Array<ITableColumn<KubernetesNamespace>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: KubernetesNamespaceLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'pods', headerCell: () => 'Pods',
      cellComponent: KubeNamespacePodCountComponent,
      cellFlex: '5',
    },
    {
      columnId: 'status', headerCell: () => 'Status',
      cellDefinition: {
        getValue: (row: KubernetesNamespace) => `${row.status.phase}`
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status.phase'
      },
      cellFlex: '5',
    },
    createKubeAgeColumn(),
    createTableColumnFavorite((row: KubernetesNamespace): UserFavorite<IFavoriteMetadata> => {
      return new UserFavorite(row.metadata.kubeId, KUBERNETES_ENDPOINT_TYPE, kubernetesNamespacesEntityType, row.metadata.name,
        {name: row.metadata.name}
      );
    }),
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no namespaces'
  };

  getGlobalActions = (): IGlobalListAction<KubernetesNamespace>[] => [];
  getMultiActions = (): IMultiListAction<KubernetesNamespace>[] => [];
  getSingleActions = (): IListAction<KubernetesNamespace>[] => [];
  getColumns = (): ITableColumn<KubernetesNamespace>[] => this.columns;
  getDataSource = (): KubernetesNamespacesDataSource => this.podsDataSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];

  constructor(
    store: Store<AppState>,
    private kubeId: BaseKubeGuid,
  ) {
    this.podsDataSource = new KubernetesNamespacesDataSource(store, this.kubeId, this);
  }

}
