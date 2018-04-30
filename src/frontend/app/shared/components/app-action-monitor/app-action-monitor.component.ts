import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { schema } from 'normalizr';
import { AppMonitorComponentTypes, IApplicationMonitorComponentState } from '../app-action-monitor-icon/app-action-monitor-icon.component';
import { rootUpdatingKey } from '../../../store/reducers/api-request-reducer/types';
import { Observable } from 'rxjs/Observable';
import { MatTableDataSource } from '@angular/material';
import { DataSource } from '@angular/cdk/table';
import { ITableListDataSource } from '../list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../list/list-table/table.types';
import {
  TableCellRequestMonitorIconComponent,
  ITableCellRequestMonitorIconConfig
} from '../list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';

@Component({
  selector: 'app-action-monitor',
  templateUrl: './app-action-monitor.component.html',
  styleUrls: ['./app-action-monitor.component.scss']
})
export class AppActionMonitorComponent<T> implements OnInit {

  @Input('data$')
  private data$: Observable<Array<T>>;

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

  @Input('trackBy')
  public trackBy = ((index: number, item: T) => index.toString());

  @Input('columns')
  public columns: ITableColumn<T>[] = [];

  @Output('currentState')
  public currentState: EventEmitter<IApplicationMonitorComponentState>;

  private dataSource: DataSource<T>;

  public allColumns: ITableColumn<T>[] = [];

  constructor() { }

  ngOnInit() {
    const cellConfig: ITableCellRequestMonitorIconConfig<T> = {
      entityKey: this.entityKey,
      schema: this.schema,
      monitorState: this.monitorState,
      updateKey: this.updateKey,
      getId: this.getId
    };
    const monitorColumn = {
      columnId: 'monitorState',
      cellComponent: TableCellRequestMonitorIconComponent,
      cellConfig,
      cellFlex: '0 0 40px'
    };
    this.allColumns = [...this.columns, monitorColumn];
    this.dataSource = {
      connect: () => this.data$,
      disconnect: () => { },
      trackBy: this.getId ? (index, item) => this.getId(item) : this.trackBy
    } as ITableListDataSource<T>;
  }

}
