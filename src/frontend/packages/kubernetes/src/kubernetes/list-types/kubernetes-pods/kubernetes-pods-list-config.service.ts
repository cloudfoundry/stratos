import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import {
  TableCellSidePanelComponent,
  TableCellSidePanelConfig,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  ISimpleListConfig,
  ListViewTypes,
} from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../store/src/public-api';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import {
  KubernetesResourceViewerComponent,
  KubernetesResourceViewerConfig,
} from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubernetesPod } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn } from '../kube-list.helper';
import { entityCatalog } from './../../../../../store/src/entity-catalog/entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType } from './../../kubernetes-entity-factory';
import { KubernetesPodContainersComponent } from './kubernetes-pod-containers/kubernetes-pod-containers.component';
import { KubernetesPodStatusComponent } from './kubernetes-pod-status/kubernetes-pod-status.component';
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';

export abstract class BaseKubernetesPodsListConfigService implements ISimpleListConfig<KubernetesPod> {

  static namespaceColumnId = 'namespace';
  static nodeColumnId = 'node';
  public showNamespaceLink = true;

  constructor(
    hideColumns: string[] = [
      BaseKubernetesPodsListConfigService.namespaceColumnId,
      BaseKubernetesPodsListConfigService.nodeColumnId
    ]
  ) {
    if (hideColumns && hideColumns.filter.length) {
      this.columns = this.columns.filter(column => hideColumns.indexOf(column.columnId) < 0);
    }
  }

  columns: Array<ITableColumn<KubernetesPod>> = [
    // Name
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: TableCellSidePanelComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '3',
      cellConfig: (pod): TableCellSidePanelConfig<KubernetesResourceViewerConfig> => ({
        text: pod.metadata.name,
        sidePanelComponent: KubernetesResourceViewerComponent,
        sidePanelConfig: {
          title: pod.metadata.name,
          resourceKind: 'pod',
          resource$: of(pod),
          definition: entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType)
        }
      })
    },
    // TODO: See #150 - keep out RC bring back after demo
    // {
    //   columnId: 'tags', headerCell: () => 'Tags',
    //   cellComponent: KubernetesPodTagsComponent,
    //   cellFlex: '5',
    // },
    // Namespace
    {
      columnId: BaseKubernetesPodsListConfigService.namespaceColumnId, headerCell: () => 'Namespace',
      cellDefinition: {
        valuePath: 'metadata.namespace',
        getLink: row => this.showNamespaceLink ? `/kubernetes/${row.metadata.kubeId}/namespaces/${row.metadata.namespace}` : null
      },
      sort: {
        type: 'sort',
        orderKey: BaseKubernetesPodsListConfigService.namespaceColumnId,
        field: 'metadata.namespace'
      },
      cellFlex: '2',
    },
    // Node
    {
      columnId: BaseKubernetesPodsListConfigService.nodeColumnId, headerCell: () => 'Node',
      cellDefinition: {
        valuePath: 'spec.nodeName',
        getLink: pod => `/kubernetes/${pod.metadata.kubeId}/nodes/${pod.spec.nodeName}/summary`
      },
      sort: {
        type: 'sort',
        orderKey: BaseKubernetesPodsListConfigService.nodeColumnId,
        field: 'spec.nodeName'
      },
      cellFlex: '2',
    },
    {
      columnId: 'expandedStatus',
      headerCell: () => 'Status',
      cellComponent: KubernetesPodStatusComponent,
      sort: {
        type: 'sort',
        orderKey: 'expandedStatus',
        field: 'expandedStatus.status'
      },
      cellFlex: '2'
    },
    {
      columnId: 'restarts',
      headerCell: () => 'Restarts',
      cellDefinition: {
        getValue: pod => pod.expandedStatus.restarts.toString()
      },
      sort: {
        type: 'sort',
        orderKey: 'restarts',
        field: 'expandedStatus.restarts'
      },
      cellFlex: '1'
    },
    createKubeAgeColumn()
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no pods'
  };
  expandComponent = KubernetesPodContainersComponent;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getMultiFiltersConfigs = () => [];
}

// TODO: RC this isn't used now?
@Injectable()
export class KubernetesPodsListConfigService extends BaseKubernetesPodsListConfigService implements IListConfig<KubernetesPod> {
  private podsDataSource: KubernetesPodsDataSource;

  getDataSource = () => this.podsDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    super([]);
    this.podsDataSource = new KubernetesPodsDataSource(store, kubeId, this);
  }

}

export class KubernetesPodsListConfig extends BaseKubernetesPodsListConfigService {
  constructor() {
    super([]);
  }
}
