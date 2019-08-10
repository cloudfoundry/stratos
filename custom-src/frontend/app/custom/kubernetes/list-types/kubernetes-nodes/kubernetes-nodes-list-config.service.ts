import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { DataFunction } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { IListConfig, IListFilter, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { ConditionType, KubernetesNode } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { getConditionSort } from '../kube-sort.helper';
import { ConditionCellComponent, SubtleConditionCellComponent } from './condition-cell/condition-cell.component';
import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodeLinkComponent } from './kubernetes-node-link/kubernetes-node-link.component';
import { KubernetesNodesDataSource } from './kubernetes-nodes-data-source';
import { NodePodCountComponent } from './node-pod-count/node-pod-count.component';

export enum KubernetesNodesListFilterKeys {
  NAME = 'name',
  IP_ADDRESS = 'ip-address',
  LABELS = 'labels'
}

@Injectable()
export class KubernetesNodesListConfigService implements IListConfig<KubernetesNode> {
  dataSource: KubernetesNodesDataSource;

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
  filters: IListFilter[] = [
    {
      default: true,
      key: KubernetesNodesListFilterKeys.NAME,
      label: 'Name',
      placeholder: 'Filter by Name'
    },
    {
      key: KubernetesNodesListFilterKeys.LABELS,
      label: 'Labels',
      placeholder: 'Filter by Labels'
    },
    {
      key: KubernetesNodesListFilterKeys.IP_ADDRESS,
      label: 'IP Address',
      placeholder: 'Filter by IP Address'
    }
  ];

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
  getDataSource = () => this.dataSource;
  getMultiFiltersConfigs = () => [];
  getFilters = (): IListFilter[] => this.filters;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    const transformEntities: DataFunction<KubernetesNode>[] = [
      (entities: KubernetesNode[], paginationState: PaginationEntityState) => {
        const filterKey = paginationState.clientPagination.filter.filterKey;
        const filterString = paginationState.clientPagination.filter.string.toUpperCase();

        switch (filterKey) {
          case KubernetesNodesListFilterKeys.IP_ADDRESS:
            return entities.filter(node => {
              const internalIP: string = node.status.addresses.find(address => {
                return address.type === 'InternalIP';
              }).address;
              return internalIP.toUpperCase().includes(filterString);
            });

          case KubernetesNodesListFilterKeys.LABELS:
            return entities.filter(node => {
              return Object.entries(node.metadata.labels).some(([label, value]) => {
                label = label.toUpperCase();
                value = value.toUpperCase();
                return label.includes(filterString) || value.includes(filterString);
              });
            });

          case KubernetesNodesListFilterKeys.NAME:
          default:
            return entities.filter(node => {
              return node.metadata.name.toUpperCase().includes(filterString);
            });
        }
      }
    ];

    this.dataSource = new KubernetesNodesDataSource(store, kubeId, this, transformEntities);
  }
}
