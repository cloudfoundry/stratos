import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { IServiceBinding } from '../../../../../core/cf-api-svc.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
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
      getValue: (row: APIResource) => `${row.entity.app.entity.name}`
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

  constructor(private store: Store<AppState>, private activatedRoute: ActivatedRoute, private datePipe: DatePipe) {

    const { serviceInstanceId, cfId } = activatedRoute.snapshot.params;
    this.dataSource = new DetachAppsDataSource(cfId, serviceInstanceId, this.store, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
