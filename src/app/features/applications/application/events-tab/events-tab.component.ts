import { EntityInfo } from '../../../../store/types/api.types';
import { resultPerPageParam } from '../../../../store/reducers/pagination.reducer';

import { Component, OnInit, ViewChild, Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, MdSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { AddParams, SetPage } from '../../../../store/actions/pagination.actions';
import { EventSchema, GetAllAppEvents } from '../../../../store/actions/app-event.actions';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CfTableDataSource } from '../../../../shared/data-sources/table-data-source-cf';
import { CfAppEventsDataSource, AppEvent } from '../../../../shared/data-sources/cf-app-events-data-source';
import { ITableColumn } from '../../../../shared/components/table/table.component';
import {
  TableCellEventTypeComponent
} from '../../../../shared/components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellEventTimestampComponent
} from '../../../../shared/components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventActionComponent
} from '../../../../shared/components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent
} from '../../../../shared/components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { CardEventComponent } from '../../../../shared/components/cards/custom-cards/card-event/card-event.component';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})

export class EventsTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  eventSource: CfTableDataSource<EntityInfo>;
  hasEvents$: Observable<boolean>;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'timestamp', headerCell: (row: EntityInfo) => 'Timestamp', cellComponent: TableCellEventTimestampComponent,
      sort: { disableClear: true }
    },
    {
      columnId: 'type', headerCell: (row: EntityInfo) => 'Type', cellComponent: TableCellEventTypeComponent
    },
    {
      columnId: 'actor_name', headerCell: (row: EntityInfo) => 'Actor Name', cellComponent: TableCellEventActionComponent
    },
    {
      columnId: 'detail', headerCell: (row: EntityInfo) => 'Detail', cellComponent: TableCellEventDetailComponent
    },
  ];
  cardComponent = CardEventComponent;


  ngOnInit() {
    // TODO: RC Move can add, can edit into here
    this.eventSource = new CfAppEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }
}
