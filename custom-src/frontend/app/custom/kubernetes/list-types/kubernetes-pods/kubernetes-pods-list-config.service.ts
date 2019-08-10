import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPod } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { getContainerLengthSort } from '../kube-sort.helper';
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';
import { PodNameLinkComponent } from './pod-name-link/pod-name-link.component';

@Injectable()
export class KubernetesPodsListConfigService implements IListConfig<KubernetesPod> {
  podsDataSource: KubernetesPodsDataSource;

  columns: Array<ITableColumn<KubernetesPod>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: PodNameLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '5',
    },
    // TODO: See #150 - keep out RC bring back after demo
    // {
    //   columnId: 'tags', headerCell: () => 'Tags',
    //   cellComponent: KubernetesPodTagsComponent,
    //   cellFlex: '5',
    // },
    {
      columnId: 'containers', headerCell: () => 'No. of Containers',
      cellDefinition: {
        valuePath: 'spec.containers.length'
      },
      sort: getContainerLengthSort,
      cellFlex: '2',
    },
    {
      columnId: 'namespace', headerCell: () => 'Namespace',
      cellDefinition: {
        valuePath: 'metadata.namespace'
      },
      sort: {
        type: 'sort',
        orderKey: 'namespace',
        field: 'metadata.namespace'
      },
      cellFlex: '5',
    },
    {
      columnId: 'node', headerCell: () => 'Node',
      cellDefinition: {
        valuePath: 'spec.nodeName'
      },
      sort: {
        type: 'sort',
        orderKey: 'node',
        field: 'spec.nodeName'
      },
      cellFlex: '5',
    },
    {
      columnId: 'status', headerCell: () => 'Status',
      cellDefinition: {
        valuePath: 'status.phase'
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status.phase'
      },
      cellFlex: '5',
    },
    {
      columnId: 'container-status', headerCell: () => `Ready Containers`,
      cellDefinition: {
        getValue: (row) => {
          const readyPods = row.status.containerStatuses.filter(status => status.ready).length;
          const allContainers = row.status.containerStatuses.length;
          return `${readyPods} / ${allContainers}`;
        }
      },
      cellFlex: '5',
    },
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no pods'
  };

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.podsDataSource;
  getMultiFiltersConfigs = () => [];
  getFilters = () => [];

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    this.podsDataSource = new KubernetesPodsDataSource(store, kubeId, this);
  }

}
