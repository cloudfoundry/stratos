import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  ListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
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
      columnId: 'actor_name', headerCell: () => 'Actor Name', cellComponent: TableCellEventActionComponent, cellFlex: '3'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '2'
    },
    // TODO: Actee
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

  constructor(store: Store<CFAppState>, cfService: CloudFoundryEndpointService) {
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

}
