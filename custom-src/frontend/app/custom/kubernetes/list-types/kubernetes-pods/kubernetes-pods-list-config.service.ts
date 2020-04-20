import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  IListDataSource,
} from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { of } from 'rxjs';

import { AppState } from '../../../../../../store/src/app-state';
import {
  TableCellSidePanelComponent,
  TableCellSidePanelConfig,
} from '../../../../shared/components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import {
  KubernetesResourceViewerComponent,
  KubernetesResourceViewerConfig,
} from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubernetesPod } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn } from '../kube-list.helper';
import { KubernetesPodContainersComponent } from './kubernetes-pod-containers/kubernetes-pod-containers.component';
import { KubernetesPodStatusComponent } from './kubernetes-pod-status/kubernetes-pod-status.component';
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';

export abstract class BaseKubernetesPodsListConfigService implements IListConfig<KubernetesPod> {

  static namespaceColumnId = 'namespace';
  static nodeColumnId = 'node';
  public showNamespaceLink = true;

  constructor(
    private kubeId: string,
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
          resource$: of(pod)
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
        getLink: row => this.showNamespaceLink ? `/kubernetes/${this.kubeId}/namespaces/${row.metadata.namespace}` : null
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
        getLink: pod => `/kubernetes/${this.kubeId}/nodes/${pod.spec.nodeName}/summary`
      },
      sort: {
        type: 'sort',
        orderKey: BaseKubernetesPodsListConfigService.nodeColumnId,
        field: 'spec.nodeName'
      },
      cellFlex: '2',
    },
    {
      columnId: 'ready',
      headerCell: () => 'Ready',
      cellDefinition: {
        getValue: pod => `${pod.expandedStatus.readyContainers}/${pod.expandedStatus.totalContainers}`
      },
      cellFlex: '1'
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
  abstract getDataSource: () => IListDataSource<KubernetesPod>;
  expandComponent = KubernetesPodContainersComponent;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getMultiFiltersConfigs = () => [];
}

@Injectable()
export class KubernetesPodsListConfigService extends BaseKubernetesPodsListConfigService {
  private podsDataSource: KubernetesPodsDataSource;

  getDataSource = () => this.podsDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
  ) {
    super(kubeId.guid, []);
    this.podsDataSource = new KubernetesPodsDataSource(store, kubeId, this);
  }

}

