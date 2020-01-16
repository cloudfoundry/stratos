import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  IListDataSource,
} from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import * as moment from 'moment';

import { AppState } from '../../../../../../store/src/app-state';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPod } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { getContainerLengthSort } from '../kube-sort.helper';
import { KubernetesPodReadinessComponent } from './kubernetes-pod-readiness/kubernetes-pod-readiness.component';
import { KubernetesPodsDataSource } from './kubernetes-pods-data-source';
import { PodNameLinkComponent } from './pod-name-link/pod-name-link.component';

export abstract class BaseKubernetesPodsListConfigService implements IListConfig<KubernetesPod> {

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
          if (row.status.phase === 'Failed') {
            return `0 / ${row.spec.containers.length}`;
          }
          const readyPods = row.status.containerStatuses.filter(status => status.ready).length;
          const allContainers = row.status.containerStatuses.length;
          return `${readyPods} / ${allContainers}`;
        }
      },
      cellFlex: '5',
    },
    // TODO: RC --> NWM From releases table. Diff between this and above?
    {
      columnId: 'ready',
      headerCell: () => 'Ready',
      cellComponent: KubernetesPodReadinessComponent,
      // cellDefinition: {
      //   valuePath: 'ready'
      // },
      sort: {
        type: 'sort',
        orderKey: 'ready',
        field: 'ready'
      },
      cellFlex: '1'
    },
    // TODO: RC --> NWM From releases table, keep in all pod tables?
    {
      columnId: 'age',
      headerCell: () => 'Age',
      cellDefinition: {
        getValue: (row: any) => {
          return moment(row.metadata.creationTimestamp).fromNow(true);
        }
      },
      sort: {
        type: 'sort',
        orderKey: 'age',
        field: 'metadata.creationTimestamp'
      },
      cellFlex: '1'
    }
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
    super();
    this.podsDataSource = new KubernetesPodsDataSource(store, kubeId, this);
  }

}

