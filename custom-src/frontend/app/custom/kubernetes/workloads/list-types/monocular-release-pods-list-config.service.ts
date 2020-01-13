import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITableColumn } from 'frontend/packages/core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';
import * as moment from 'moment';
import { Observable } from 'rxjs';

import {
  KubernetesPodReadinessComponent,
} from '../../list-types/kubernetes-pods/kubernetes-pod-readiness/kubernetes-pod-readiness.component';
import {
  KubernetesPodStatusComponent,
} from '../../list-types/kubernetes-pods/kubernetes-pod-status/kubernetes-pod-status.component';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasePod } from '../workload.types';
import { HelmReleasePodsDataSource } from './monocular-release-pods-list-source';

@Injectable()
export class HelmReleasePodsListConfig implements IListConfig<HelmReleasePod> {
  isLocal = true;
  dataSource: HelmReleasePodsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  tableFixedRowHeight = true;
  columns: ITableColumn<HelmReleasePod>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'metadata.name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '4'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellComponent: KubernetesPodStatusComponent,
      // cellDefinition: {
      //   valuePath: 'status.phase'
      // },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status.phase'
      },
      cellFlex: '1'
    },
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
    // {
    //   columnId: 'restarts',
    //   headerCell: () => 'Restarts',
    //   cellDefinition: {
    //     valuePath: 'restarts'
    //   },
    //   sort: {
    //     type: 'sort',
    //     orderKey: 'restarts',
    //     field: 'restarts'
    //   },
    //   cellFlex: '1'
    // },
  ];
  initialised$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    helmReleaseHelper: HelmReleaseHelperService
  ) {
    this.dataSource = new HelmReleasePodsDataSource(this.store, this, helmReleaseHelper.endpointGuid, helmReleaseHelper.releaseTitle);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
