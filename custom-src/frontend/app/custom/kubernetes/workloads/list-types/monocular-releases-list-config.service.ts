import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITableColumn } from 'frontend/packages/core/src/shared/components/list/list-table/table.types';
import {
  TableCellEndpointNameComponent,
} from 'frontend/packages/core/src/shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import {
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes,
} from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';
import { filter, map } from 'rxjs/operators';

import { defaultHelmKubeListPageSize } from '../../list-types/kube-helm-list-types';
import { HelmRelease } from '../workload.types';
import { KubernetesNamespacesFilterItem, KubernetesNamespacesFilterService } from './kube-namespaces-filter-config.service';
import { HelmReleasesDataSource } from './monocular-releases-list-source';

@Injectable()
export class HelmReleasesListConfig implements IListConfig<HelmRelease> {

  isLocal = true;
  dataSource: HelmReleasesDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter by Name',
  };
  pageSizeOptions = defaultHelmKubeListPageSize;
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns: ITableColumn<HelmRelease>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name',
        getLink: (row: HelmRelease) => row.guid,
        newTab: false,
        externalLink: false,
        showShortLink: false
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2',
    },
    {
      columnId: 'cluster',
      headerCell: () => 'Cluster',
      cellComponent: TableCellEndpointNameComponent,
      cellFlex: '2'
    },
    {
      columnId: 'namespace',
      headerCell: () => 'Namespace',
      cellDefinition: {
        valuePath: 'namespace'
      },
      sort: {
        type: 'sort',
        orderKey: 'namespace',
        field: 'namespace'
      },
      cellFlex: '1'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellDefinition: {
        valuePath: 'status'
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status'
      },
      cellFlex: '2'
    },
    {
      columnId: 'version',
      headerCell: () => 'Version',
      cellDefinition: {
        valuePath: 'version'
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'version'
      },
      cellFlex: '1'
    },
    {
      columnId: 'last_Deployed',
      headerCell: () => 'Last Deployed',
      cellDefinition: {
        getValue: (row) => `${this.datePipe.transform(row.info.last_deployed, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'lastDeployed',
        field: 'lastDeployed'
      },
      cellFlex: '3'
    },
  ];

  private multiFilterConfigs: IListMultiFilterConfig[];

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    kubeNamespaceService: KubernetesNamespacesFilterService
  ) {
    this.dataSource = new HelmReleasesDataSource(this.store, this);

    this.multiFilterConfigs = [
      createKubeNamespaceFilterConfig('kubeId', 'Kubernetes', kubeNamespaceService.kube),
      createKubeNamespaceFilterConfig('namespace', 'Namespace', kubeNamespaceService.namespace),
    ];
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  public getDataSource = () => this.dataSource;
}

function createKubeNamespaceFilterConfig(key: string, label: string, cfOrgSpaceItem: KubernetesNamespacesFilterItem) {
  return {
    key,
    label,
    ...cfOrgSpaceItem,
    list$: cfOrgSpaceItem.list$.pipe(map((entities: any[]) => {
      return entities.map(entity => ({
        label: entity.name || entity.metadata.name,
        item: entity,
        value: entity.guid || entity.metadata.name // Endpoint search via guid, namespace by name (easier filtering)
      }));
    })),
  };
}
