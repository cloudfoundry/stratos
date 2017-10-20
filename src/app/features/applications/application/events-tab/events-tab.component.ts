import { resultPerPageParam } from '../../../../store/reducers/pagination.reducer';

import { Component, OnInit, ViewChild, Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, MdSort } from '@angular/material';
import { AppEventsDataSource } from './events-data-source';
import { Observable } from 'rxjs/Observable';
import { AddParams, SetPage } from '../../../../store/actions/pagination.actions';
import { EventSchema } from '../../../../store/actions/app-event.actions';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})

export class EventsTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  dataSource: AppEventsDataSource;
  hasEvents$: Observable<boolean>;
  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;

  gotToPage() {
    this.store.dispatch(new AddParams(EventSchema.key, AppEventsDataSource.paginationKey, {
      [resultPerPageParam]: 10
    }));
  }

  ngOnInit() {
    this.dataSource = new AppEventsDataSource(this.store, this.appService, this.paginator, this.sort);
  }
}

// TODO: RC Move

