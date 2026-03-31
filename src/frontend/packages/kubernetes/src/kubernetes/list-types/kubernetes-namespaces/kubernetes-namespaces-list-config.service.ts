import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import {
  createTableColumnFavorite,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-favorite/table-cell-favorite.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes, IGlobalListAction, IMultiListAction, IListAction, IListMultiFilterConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../store/src/public-api';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespace } from '../../store/kube.types';
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
  private kubeId = inject(BaseKubeGuid);

  podsDataSource: KubernetesNamespacesDataSource;

  columns: Array<ITableColumn<KubernetesNamespace>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: KubernetesNamespaceLinkComponent,
      sort: {
        type: 'natural-sort',
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

  constructor() {
    const store = inject<Store<AppState>>(Store);

    this.podsDataSource = new KubernetesNamespacesDataSource(store, this.kubeId, this);
  }

}
