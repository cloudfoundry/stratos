import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../../cf-api-svc.types';
import { CFAppState } from '../../../../../cf-app-state';
import { DetachAppsDataSource } from './detach-apps-data-source';

@Injectable()
export class DetachAppsListConfigService implements IListConfig<APIResource> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: DetachAppsDataSource;
  defaultView = 'table' as ListView;
  allowSelection = true;
  text = {
    title: null,
    filter: null,
    noEntries: 'There are no service bindings'
  };
  columns: ITableColumn<APIResource<IServiceBinding>>[] = [{
    columnId: 'appName',
    headerCell: () => 'App Name',
    cellDefinition: {
      valuePath: 'entity.app.entity.name'
    },
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.app.entity.name'
    }
  }, {
    columnId: 'createdAt',
    headerCell: () => 'Binding Date',
    cellDefinition: {
      getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
    },
    sort: {
      type: 'sort',
      orderKey: 'createdAt',
      field: 'metadata.created_at'
    },
  }];

  constructor(private store: Store<CFAppState>, activatedRoute: ActivatedRoute, private datePipe: DatePipe) {
    const { serviceInstanceId, endpointId } = activatedRoute.snapshot.params;
    this.dataSource = new DetachAppsDataSource(endpointId, serviceInstanceId, this.store, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
