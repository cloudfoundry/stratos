import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../../../../store/src/app-state';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasePod } from '../store/helm.types';
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
        valuePath: 'name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '4'
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
      cellFlex: '1'
    },
    {
      columnId: 'ready',
      headerCell: () => 'Ready',
      cellDefinition: {
        valuePath: 'ready'
      },
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
        valuePath: 'age'
      },
      sort: {
        type: 'sort',
        orderKey: 'age',
        field: 'age'
      },
      cellFlex: '1'
    },
    {
      columnId: 'restarts',
      headerCell: () => 'Restarts',
      cellDefinition: {
        valuePath: 'restarts'
      },
      sort: {
        type: 'sort',
        orderKey: 'restarts',
        field: 'restarts'
      },
      cellFlex: '1'
    },
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
  public getFilters = () => [];
  public setFilter = (id: string) => null;
  public getDataSource = () => this.dataSource;
}
