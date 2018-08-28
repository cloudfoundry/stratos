
import { DataSource } from '@angular/cdk/table';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { schema } from 'normalizr';
import { never as observableNever, Observable, of as observableOf } from 'rxjs';
import { rootUpdatingKey } from '../../../store/reducers/api-request-reducer/types';
import { AppMonitorComponentTypes, IApplicationMonitorComponentState } from '../app-action-monitor-icon/app-action-monitor-icon.component';
import { ITableListDataSource } from '../list/data-sources-controllers/list-data-source-types';
import {
  ITableCellRequestMonitorIconConfig,
  TableCellRequestMonitorIconComponent
} from '../list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { ITableColumn } from '../list/list-table/table.types';

@Component({
  selector: 'app-action-monitor',
  templateUrl: './app-action-monitor.component.html',
  styleUrls: ['./app-action-monitor.component.scss']
})
export class AppActionMonitorComponent<T> implements OnInit {

  @Input()
  private data$: Observable<Array<T>> = observableNever();

  @Input()
  public entityKey: string;

  @Input()
  public schema: schema.Entity;

  @Input()
  public monitorState: AppMonitorComponentTypes = AppMonitorComponentTypes.FETCHING;

  @Input()
  public updateKey = rootUpdatingKey;

  @Input()
  public getId: (element) => string;

  @Input()
  public trackBy = ((index: number, item: T) => index.toString());

  @Input()
  public getCellConfig: (element) => ITableCellRequestMonitorIconConfig;

  @Input()
  public columns: ITableColumn<T>[] = [];

  @Output()
  public currentState: EventEmitter<IApplicationMonitorComponentState>;

  public dataSource: DataSource<T>;

  public allColumns: ITableColumn<T>[] = [];

  constructor() { }

  ngOnInit() {
    const _getCellConfig = () => ({
      entityKey: this.entityKey,
      schema: this.schema,
      monitorState: this.monitorState,
      updateKey: this.updateKey,
      getId: this.getId
    });
    const monitorColumn = {
      columnId: 'monitorState',
      cellComponent: TableCellRequestMonitorIconComponent,
      cellConfig: this.getCellConfig || _getCellConfig,
      cellFlex: '0 0 40px'
    };

    this.allColumns = [...this.columns, monitorColumn];
    this.dataSource = {
      connect: () => this.data$,
      disconnect: () => { },
      trackBy: this.getId ? (index, item) => this.getId(item) : this.trackBy,
      isTableLoading$: observableOf(false)
    } as ITableListDataSource<T>;
  }

}
