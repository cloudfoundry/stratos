import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../../cf-api-svc.types';
import { CFAppState } from '../../../../../cf-app-state';
import { DetachAppsDataSource } from './detach-apps-data-source';

@Injectable({
  providedIn: 'root'
})
export class DetachAppsListConfigService implements IListConfig<APIResource<IServiceBinding>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: DetachAppsDataSource;
  defaultView = 'table' as ListView;
  allowSelection = true;
  text = {
    title: null as string | null,
    filter: null as string | null,
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
      getValue: (row: APIResource<IServiceBinding>) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
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

  getColumns(): ITableColumn<APIResource<IServiceBinding>>[] {
    return this.columns;
  }
  getGlobalActions(): IGlobalListAction<APIResource<IServiceBinding>>[] {
    return [];
  }
  getMultiActions(): IMultiListAction<APIResource<IServiceBinding>>[] {
    return [];
  }
  getSingleActions(): IListAction<APIResource<IServiceBinding>>[] {
    return [];
  }
  getMultiFiltersConfigs(): IListMultiFilterConfig[] {
    return [];
  }
  getDataSource(): DetachAppsDataSource {
    return this.dataSource;
  }
}
