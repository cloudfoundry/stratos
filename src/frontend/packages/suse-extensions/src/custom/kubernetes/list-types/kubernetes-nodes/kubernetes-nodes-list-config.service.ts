import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { DataFunction } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn } from '../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  IListFilter,
  ListViewTypes,
} from '../../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/src/app-state';
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { ConditionType, KubernetesAddressExternal, KubernetesAddressInternal, KubernetesNode } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn, getConditionSort } from '../kube-list.helper';
import { ConditionCellComponent } from './condition-cell/condition-cell.component';
import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodeIpsComponent } from './kubernetes-node-ips/kubernetes-node-ips.component';
import { KubernetesNodeLabelsComponent } from './kubernetes-node-labels/kubernetes-node-labels.component';
import { KubernetesNodeLinkComponent } from './kubernetes-node-link/kubernetes-node-link.component';
import { KubernetesNodePressureComponent } from './kubernetes-node-pressure/kubernetes-node-pressure.component';
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
      columnId: 'ips', headerCell: () => 'IPs',
      cellComponent: KubernetesNodeIpsComponent,
      cellFlex: '1',
    },
    {
      columnId: 'labels', headerCell: () => 'Labels',
      cellComponent: KubernetesNodeLabelsComponent,
      cellFlex: '1',
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
      columnId: 'condition', headerCell: () => 'Condition',
      cellComponent: KubernetesNodePressureComponent,
      cellFlex: '2',
    },
    {
      columnId: 'numPods', headerCell: () => 'Pods',
      cellComponent: NodePodCountComponent,
      cellFlex: '2',
    },
    {
      columnId: 'capacity', headerCell: () => 'Capacity',
      cellComponent: KubernetesNodeCapacityComponent,
      cellFlex: '3',
    },
    // Display labels as the usual chip list
    // {
    //   columnId: 'labels', headerCell: () => 'Labels',
    //   cellComponent: KubernetesLabelsCellComponent,
    //   cellFlex: '6',
    // },
    createKubeAgeColumn()
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
    filter: '',
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
        if (!paginationState.clientPagination.filter.string) {
          return entities;
        }

        const filterString = paginationState.clientPagination.filter.string.toUpperCase();

        const filterKey = paginationState.clientPagination.filter.filterKey;

        switch (filterKey) {
          case KubernetesNodesListFilterKeys.IP_ADDRESS:
            return entities.filter(node => {
              const ipAddress =
                node.status.addresses.find(address => address.type === KubernetesAddressInternal) ||
                node.status.addresses.find(address => address.type === KubernetesAddressExternal);
              return ipAddress ? ipAddress.address.toUpperCase().includes(filterString) : false;
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
            return entities.filter(node => {
              return node.metadata.name.toUpperCase().includes(filterString);
            });
          default:
            return entities;
        }
      }
    ];

    this.dataSource = new KubernetesNodesDataSource(store, kubeId, this, transformEntities);
  }
}
