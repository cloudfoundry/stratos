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
import { TableColumn } from '../../../../shared/components/table/table.component';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})

export class EventsTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  eventSource: CfTableDataSource<EntityInfo>;
  hasEvents$: Observable<boolean>;
  columns: Array<TableColumn<EntityInfo>> = [
    {
      columnId: 'timestamp', headerCell: (row: EntityInfo) => 'Timestamp', cell: (row: EntityInfo) => `${row.entity.timestamp}`,
      sort: { disableClear: true }
    },
    {
      columnId: 'type', headerCell: (row: EntityInfo) => 'Type', cell: (row: EntityInfo) => `${row.entity.type}`,
      sort: { disableClear: true }
    },
    {
      columnId: 'actor_name', headerCell: (row: EntityInfo) => 'Actor Name', cell: (row: EntityInfo) => `${row.entity.actor_name}`,
      sort: { disableClear: true }
    },
    {
      columnId: 'detail', headerCell: (row: EntityInfo) => 'Detail', cell: (row: EntityInfo) => `${row.entity.metadata}`,
      sort: { disableClear: true }
    },
  ];


  ngOnInit() {
    this.eventSource = new CfAppEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }
}
