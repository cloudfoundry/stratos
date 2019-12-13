import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  ListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { QParam, QParamJoiners } from '../../../../../../../store/src/q-param';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CFAppState } from '../../../../../cf-app-state';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { TableCellEventActeeComponent } from '../app-event/table-cell-event-actee/table-cell-event-actee.component';
import { TableCellEventActionComponent } from '../app-event/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from '../app-event/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from '../app-event/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../app-event/table-cell-event-type/table-cell-event-type.component';
import { CfEventsDataSource } from './cf-events-data-source';

@Injectable()
export class CfEventsConfigService extends ListConfig<APIResource> implements IListConfig<APIResource> {

  eventSource: CfEventsDataSource;
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'actor', headerCell: () => 'Actor', cellComponent: TableCellEventActionComponent, cellFlex: '2'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '2'
    },
    {
      columnId: 'actee', headerCell: () => 'Actee', cellComponent: TableCellEventActeeComponent, cellFlex: '3'
    },
    {
      columnId: 'detail', headerCell: () => 'Detail', cellComponent: TableCellEventDetailComponent, cellFlex: '6'
    },
    {
      columnId: 'timestamp',
      headerCell: () => 'Timestamp',
      cellComponent: TableCellEventTimestampComponent,
      sort: true,
      cellFlex: '3'
    },
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no events'
  };

  constructor(private store: Store<CFAppState>, cfService: CloudFoundryEndpointService) {
    super();
    this.eventSource = new CfEventsDataSource(
      store,
      cfService.cfGuid,
      this
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.eventSource;
  getMultiFiltersConfigs = () => [];

  setFilters(values: { actee: string, type: string[] }) {
    const action = this.eventSource.action as PaginatedAction;
    // q=filter IN a,b,c

    const addQs: string[] = [];
    const removeQs: string[] = [];

    if (!!values.type && !!values.type.length) {
      addQs.push(new QParam('type', values.type, QParamJoiners.in).toString());
    } else {
      removeQs.push('type');
    }

    if (!!values.actee && !!values.actee.length) {
      addQs.push(new QParam('actee', values.actee, QParamJoiners.in).toString());
    } else {
      removeQs.push('actee');
    }

    if (!!addQs.length) {
      this.store.dispatch(new AddParams(action, this.eventSource.paginationKey, { q: addQs }));
    }
    if (!!removeQs.length) {
      this.store.dispatch(new RemoveParams(action, action.paginationKey, [], removeQs));
    }
  }
}
