import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { schema } from 'normalizr';
import { AppMonitorComponentTypes, IApplicationMonitorComponentState } from '../app-action-monitor-icon/app-action-monitor-icon.component';
import { rootUpdatingKey } from '../../../store/reducers/api-request-reducer/types';
import { Observable } from 'rxjs/Observable';
import { MatTableDataSource } from '@angular/material';
import { DataSource } from '@angular/cdk/table';

@Component({
  selector: 'app-action-monitor',
  templateUrl: './app-action-monitor.component.html',
  styleUrls: ['./app-action-monitor.component.scss']
})
export class AppActionMonitorComponent implements OnInit {

  @Input('data$')
  private data$: Observable<Array<any>>;

  @Input('entityKey')
  public entityKey: string;

  @Input('schema')
  public schema: schema.Entity;

  @Input('monitorState')
  public monitorState: AppMonitorComponentTypes = AppMonitorComponentTypes.FETCHING;

  @Input('updateKey')
  public updateKey = rootUpdatingKey;

  @Input('getId')
  public getId: (element) => string;

  @Input('columns')
  public columns: string[];

  @Output('currentState')
  public currentState: EventEmitter<IApplicationMonitorComponentState>;

  private dataSource: DataSource<any>;

  public displayedColumns = ['id', 'state'];

  constructor() { }

  ngOnInit() {
    this.columns.push('state');
    this.dataSource = {
      connect: () => this.data$,
      disconnect: () => { }
    } as DataSource<any>;
  }

}
