import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';
import { KubernetesPod } from '../../store/kube.types';
import { KubernetesPodTagsComponent } from './kubernetes-pod-tags/kubernetes-pod-tags.component';
import { getContainerLengthSort } from '../kube-sort.helper';

@Injectable()
export class KubernetesPodsListConfigService implements IListConfig<KubernetesPod> {
  podsDataSource: KubernetesPodsDataSource;

  columns: Array<ITableColumn<KubernetesPod>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.metadata.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'tags', headerCell: () => 'Tags',
      cellComponent: KubernetesPodTagsComponent,
      cellFlex: '5',
    },
    {
      columnId: 'containers', headerCell: () => 'No. of Containers',
      cellDefinition: {
        getValue: (row) => `${row.spec.containers.length}`
      },
      sort: getContainerLengthSort,
      cellFlex: '2',
    },
    {
      columnId: 'image', headerCell: () => 'Image',
      cellDefinition: {
        // Assuming 1 pod = 1 container
        getValue: (row) => `${row.spec.containers.map(c => c.image)} `
      },
      cellFlex: '5',
    },
    {
      columnId: 'namespace', headerCell: () => 'Namespace',
      cellDefinition: {
        getValue: (row) => `${row.metadata.namespace}`
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
        getValue: (row) => `${row.spec.nodeName}`
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
    kubeId: BaseKubeGuid,
  ) {
    this.podsDataSource = new KubernetesPodsDataSource(this.store, kubeId, this);
  }

}
