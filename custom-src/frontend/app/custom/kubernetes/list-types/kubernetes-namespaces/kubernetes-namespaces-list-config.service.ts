import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { KubernetesNamespace } from '../../../kubernetes/store/kube.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn } from '../kube-list.helper';
import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count/kube-namespace-pod-count.component';
import { KubernetesNamespaceLinkComponent } from './kubernetes-namespace-link/kubernetes-namespace-link.component';
import { KubernetesNamespacesDataSource } from './kubernetes-namespaces-data-source';


@Injectable()
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
    // FIXME: Hide link until the link is fixed
    // {
    //   columnId: 'view', headerCell: () => 'Dashboard',
    //   cellDefinition: {
    //     getValue: () => 'View',
    //     getLink: (row: KubernetesNamespace) => {
    //       return `/kubernetes/${this.kubeId.guid}/dashboard/overview?namespace=${row.metadata.name}`;
    //     },
    //   },
    //   cellFlex: '3',
    // },
    {
      columnId: 'pods', headerCell: () => 'Pods',
      cellComponent: KubeNamespacePodCountComponent,
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
    createKubeAgeColumn()
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no namespaces'
  };
  private initialised$: Observable<boolean>;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.podsDataSource;
  getMultiFiltersConfigs = () => [];
  getInitialised = () => this.initialised$;

  constructor(
    store: Store<AppState>,
    private kubeId: BaseKubeGuid,
    kubeService: KubernetesEndpointService
  ) {
    this.podsDataSource = new KubernetesNamespacesDataSource(store, this.kubeId, this);

    const hasDashboard = kubeService.kubeDashboardConfigured$.pipe(
      first(),
      tap((enabled) => {
        if (!enabled) {
          this.columns = this.columns.filter(column => column.columnId !== 'view');
        }
      })
    );
    this.initialised$ = hasDashboard.pipe(
      map(() => true)
    );
  }

}
