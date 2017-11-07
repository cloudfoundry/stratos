import { EntityInfo } from '../../../../store/types/api.types';
import { resultPerPageParam } from '../../../../store/reducers/pagination.reducer';

import { Component, OnInit, ViewChild, Pipe, PipeTransform, OnDestroy } from '@angular/core';
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
import { CardEventComponent } from '../../../../shared/components/cards/custom-cards/card-app-event/card-app-event.component';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})

export class EventsTabComponent implements OnInit, OnDestroy {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  eventSource: CfTableDataSource<EntityInfo>;
  hasEvents$: Observable<boolean>;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'timestamp', headerCell: () => 'Timestamp', cellComponent: TableCellEventTimestampComponent, sort: true, cellFlex: '2'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '1'
    },
    {
      columnId: 'actor_name', headerCell: () => 'Actor Name', cellComponent: TableCellEventActionComponent, cellFlex: '1'
    },
    {
      columnId: 'detail', headerCell: () => 'Detail', cellComponent: TableCellEventDetailComponent, cellFlex: '6'
    },
  ];
  cardComponent = CardEventComponent;


  ngOnInit() {
    // TODO: RC Add padding: 0 10px;
    // TODO: RC Move can add, can edit into here
    this.eventSource = new CfAppEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }

  ngOnDestroy() {
    this.eventSource.destroy();
  }
}
