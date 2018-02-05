import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppEventsDataSource } from './cf-app-events-data-source';
import { IListConfig, ListViewTypes } from '../../list.component';
import { EntityInfo } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import {
  TableCellEventTimestampComponent,
} from './table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from './table-cell-event-type/table-cell-event-type.component';
import {
  TableCellEventActionComponent,
} from './table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from './table-cell-event-detail/table-cell-event-detail.component';
import { Injectable } from '@angular/core';

@Injectable()
export class CfAppEventsConfigService implements IListConfig<EntityInfo> {

  eventSource: CfAppEventsDataSource;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'timestamp', headerCell: () => 'Timestamp', cellComponent: TableCellEventTimestampComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '2'
    },
    {
      columnId: 'actor_name', headerCell: () => 'Actor Name', cellComponent: TableCellEventActionComponent, cellFlex: '3'
    },
    {
      columnId: 'detail', headerCell: () => 'Detail', cellComponent: TableCellEventDetailComponent, cellFlex: '6'
    },
  ];
  pageSizeOptions = [5, 25, 50];
  viewType = ListViewTypes.TABLE_ONLY;

  constructor(private store: Store<AppState>, private appService: ApplicationService) {
    this.eventSource = new CfAppEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.eventSource;
  getMultiFiltersConfigs = () => [];

}
