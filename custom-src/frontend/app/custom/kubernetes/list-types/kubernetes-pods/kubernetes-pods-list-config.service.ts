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
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';

export abstract class BaseKubernetesPodsListConfigService implements IListConfig<KubernetesPod> {

  static namespaceColumnId = 'namespace';
  public showNamespaceLink = true;

  constructor(
    private kubeId: string,
    showNamespaces = false
  ) {
    if (!showNamespaces) {
      this.columns = this.columns.filter(column => column.columnId !== BaseKubernetesPodsListConfigService.namespaceColumnId);
    }
  }

  columns: Array<ITableColumn<KubernetesPod>> = [
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
          title: `Pod Summary: ${pod.metadata.name}`,
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
    {
      columnId: BaseKubernetesPodsListConfigService.namespaceColumnId, headerCell: () => 'Namespace',
      cellDefinition: {
        valuePath: 'metadata.namespace',
        getLink: row => this.showNamespaceLink ? `/kubernetes/${this.kubeId}/namespaces/${row.metadata.namespace}` : null
      },
      sort: {
        type: 'sort',
        orderKey: 'namespace',
        field: 'metadata.namespace'
      },
      cellFlex: '2',
    },
    {
      columnId: 'node', headerCell: () => 'Node',
      cellDefinition: {
        valuePath: 'spec.nodeName',
        getLink: pod => `/kubernetes/${this.kubeId}/nodes/${pod.spec.nodeName}/summary`
      },
      sort: {
        type: 'sort',
        orderKey: 'node',
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
      cellDefinition: {
        valuePath: 'expandedStatus.status'
      },
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
    super(kubeId.guid, true);
    this.podsDataSource = new KubernetesPodsDataSource(store, kubeId, this);
  }

}

