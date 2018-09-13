import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubeService } from '../../store/kube.types';
import { HelmReleaseServicesDataSource } from './helm-release-services-data-source';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesPodTagsComponent } from '../kubernetes-pods/kubernetes-pod-tags/kubernetes-pod-tags.component';

@Injectable()
export class HelmReleaseServicesListConfig implements IListConfig<KubeService> {
  podsDataSource: HelmReleaseServicesDataSource;

  columns: Array<ITableColumn<KubeService>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.metadata.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    },
    {
      columnId: 'labels', headerCell: () => 'Labels',
      cellComponent: KubernetesPodTagsComponent,
      cellFlex: '5',
    },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Services'
  };
  enableTextFilter = false;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.podsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private kubeId: BaseKubeGuid,
    private helmReleaseService: HelmReleaseService
  ) {
    this.podsDataSource = new HelmReleaseServicesDataSource(this.store, kubeId, this, helmReleaseService);
  }

}
