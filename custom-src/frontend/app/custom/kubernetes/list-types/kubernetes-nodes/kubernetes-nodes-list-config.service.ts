import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, IListFilter, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { ConditionType, KubernetesNode } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { getConditionSort } from '../kube-sort.helper';
import { ConditionCellComponent, SubtleConditionCellComponent } from './condition-cell/condition-cell.component';
import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodeLinkComponent } from './kubernetes-node-link/kubernetes-node-link.component';
import {
  LabelsKubernetesNodesDataSource,
  NameKubernetesNodesDataSource,
  IPAddressKubernetesNodesDataSource
} from './kubernetes-nodes-data-source';
import { NodePodCountComponent } from './node-pod-count/node-pod-count.component';

@Injectable()
export class KubernetesNodesListConfigService implements IListConfig<KubernetesNode> {
  columns: Array<ITableColumn<KubernetesNode>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: KubernetesNodeLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'ready', headerCell: () => 'Ready',
      cellConfig: {
        conditionType: ConditionType.Ready
      },
      cellComponent: ConditionCellComponent,

      sort: getConditionSort(ConditionType.Ready),
      cellFlex: '2',
    },
    {
      columnId: 'diskPressure', headerCell: () => 'Disk Pressure',
      cellComponent: SubtleConditionCellComponent,
      cellConfig: {
        conditionType: ConditionType.DiskPressure
      },
      sort: getConditionSort(ConditionType.DiskPressure),
      cellFlex: '2',
    },
    {
      columnId: 'memPressure', headerCell: () => 'Memory Pressure',
      cellComponent: SubtleConditionCellComponent,
      cellConfig: {
        conditionType: ConditionType.MemoryPressure
      },
      sort: getConditionSort(ConditionType.MemoryPressure),
      cellFlex: '2',
    },
    {
      columnId: 'numPods', headerCell: () => 'No. of Pods',
      cellComponent: NodePodCountComponent,
      cellFlex: '2',
    },
    {
      columnId: 'capacity', headerCell: () => 'Capacity',
      cellComponent: KubernetesNodeCapacityComponent,
      cellFlex: '5',
    },
  ];
  filters: IListFilter<KubernetesNode>[];
  filterSelected: IListFilter<KubernetesNode>;

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;

  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no nodes'
  };

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.filterSelected.dataSource;
  getMultiFiltersConfigs = () => [];
  getFilters = (): IListFilter<KubernetesNode>[] => this.filters;
  setFilter = (id: string) => {
    this.filterSelected = this.filters.find(filter => filter.id === id);
  }

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    this.filters = [
      {
        dataSource: new NameKubernetesNodesDataSource(store, kubeId, this),
        default: true,
        id: 'name',
        label: 'Name',
        placeholder: 'Filter by Name'
      },
      {
        dataSource: new LabelsKubernetesNodesDataSource(store, kubeId, this),
        id: 'labels',
        label: 'Labels',
        placeholder: 'Filter by Labels'
      },
      {
        dataSource: new IPAddressKubernetesNodesDataSource(store, kubeId, this),
        id: 'ip-address',
        label: 'IP Address',
        placeholder: 'Filter by IP Address'
      }
    ];

    this.filterSelected = this.filters.find(filter => filter.default === true);
  }
}
