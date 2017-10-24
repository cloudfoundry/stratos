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

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})

export class EventsTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  dataSource: CfTableDataSource<AppEvent>;
  hasEvents$: Observable<boolean>;
  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;

  ngOnInit() {
    this.dataSource = new CfAppEventsDataSource(
      this.paginator,
      this.sort,
      Observable.of(''),
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }
}
