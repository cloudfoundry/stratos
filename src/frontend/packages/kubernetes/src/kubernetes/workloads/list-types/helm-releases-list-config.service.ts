import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITableColumn } from '@stratosui/core';
import {
  TableCellEndpointNameComponent,
} from '@stratosui/core';
import {
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes,
  IGlobalListAction,
  IMultiListAction,
  IListAction,
} from '@stratosui/core';
import { AppState } from '@stratosui/store';
import { filter, map } from 'rxjs/operators';

import { ListView } from '../../../../../store/src/actions/list.actions';
import { defaultHelmKubeListPageSize } from '../../list-types/kube-helm-list-types';
import { HelmRelease } from '../workload.types';
import { HelmReleaseCardComponent } from './helm-release-card/helm-release-card.component';
import { HelmReleasesDataSource } from './helm-releases-list-source';
import { KubernetesNamespacesFilterItem, KubernetesNamespacesFilterService } from './kube-namespaces-filter-config.service';

@Injectable({
  providedIn: 'root'
})
export class HelmReleasesListConfig implements IListConfig<HelmRelease> {

  isLocal = true;
  dataSource: HelmReleasesDataSource;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  text = {
    title: '',
    filter: 'Filter by Name',
  };
  pageSizeOptions = defaultHelmKubeListPageSize;
  enableTextFilter = true;
  cardComponent = HelmReleaseCardComponent;
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
        valuePath: 'namespace',
        getLink: (row: HelmRelease) => `/kubernetes/${row.endpointId}/namespaces/${row.namespace}`
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
        getValue: (row: HelmRelease) => row.status.charAt(0).toUpperCase() + row.status.substring(1)
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
      headerCell: () => 'Chart Version',
      cellDefinition: {
        valuePath: 'chart.metadata.version'
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'chart.metadata.version'
      },
      cellFlex: '1'
    },
    {
      columnId: 'last_Deployed',
      headerCell: () => 'Last Deployed',
      cellDefinition: {
        getValue: (row: HelmRelease) => `${this.datePipe.transform(row.info.last_deployed, 'medium')}`
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

  public getColumns = (): ITableColumn<HelmRelease>[] => this.columns;
  public getGlobalActions = (): IGlobalListAction<HelmRelease>[] => [];
  public getMultiActions = (): IMultiListAction<HelmRelease>[] => [];
  public getSingleActions = (): IListAction<HelmRelease>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => this.multiFilterConfigs;
  public getDataSource = (): HelmReleasesDataSource => this.dataSource;
}

function createKubeNamespaceFilterConfig(key: string, label: string, cfOrgSpaceItem: KubernetesNamespacesFilterItem): IListMultiFilterConfig {
  return {
    key,
    label,
    ...cfOrgSpaceItem,
    list$: cfOrgSpaceItem.list$.pipe(map((entities: Array<{ name?: string; metadata?: { name?: string }; guid?: string }>) => {
      return entities.map(entity => ({
        label: entity.name || entity.metadata?.name || '',
        item: entity,
        value: entity.guid || entity.metadata?.name || '' // Endpoint search via guid, namespace by name (easier filtering)
      }));
    })),
  };
}
