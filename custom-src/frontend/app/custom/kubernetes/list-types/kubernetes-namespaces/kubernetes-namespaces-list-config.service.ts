import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { selectEntity } from '../../../../../../store/src/selectors/api.selectors';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { KubernetesNamespace } from '../../../kubernetes/store/kube.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesDashboard } from '../../store/kubernetes.actions';
import { kubernetesDashboardSchemaKey } from '../../store/kubernetes.entities';
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
    {
      columnId: 'view', headerCell: () => 'Dashboard',
      cellDefinition: {
        getValue: () => 'View',
        getLink: (row: KubernetesNamespace) => {
          return `/kubernetes/${this.kubeId.guid}/dashboard/overview?namespace=${row.metadata.name}`;
        },
      },
      cellFlex: '3',
    },
    {
      columnId: 'pods', headerCell: () => 'No. of Pods',
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
  ];

  pageSizeOptions = [9, 45, 90];
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
    private kubeId: BaseKubeGuid
  ) {
    this.podsDataSource = new KubernetesNamespacesDataSource(store, this.kubeId, this);

    // TODO: RC Check whether we already have the value before dispatching a new action
    store.dispatch(new GetKubernetesDashboard(this.kubeId.guid));
    const hasDashboard = store.select(selectEntity(kubernetesDashboardSchemaKey, this.kubeId.guid)).pipe(
      filter(p => !!p),
      tap((p: any) => {
        if (!p.installed) {
          this.columns = this.columns.filter(column => column.columnId !== 'view');
        }
      })
    );
    this.initialised$ = hasDashboard.pipe(
      map(() => true)
    );
  }

}
