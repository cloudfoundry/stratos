import { Component, OnInit, ViewChild, Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator } from '@angular/material';
import { AppEventsDataSource } from './events-data-source';
import { Observable } from 'rxjs/Observable';

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

  ngOnInit() {
    this.dataSource = new AppEventsDataSource(this.store, this.appService, this.paginator);
  }
}

// TODO: RC Move

