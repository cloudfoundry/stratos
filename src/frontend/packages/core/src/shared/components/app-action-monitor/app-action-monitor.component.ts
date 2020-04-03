import { DataSource } from '@angular/cdk/table';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { schema } from 'normalizr';
import { never as observableNever, Observable, of as observableOf } from 'rxjs';

import { rootUpdatingKey } from '../../../../../store/src/reducers/api-request-reducer/types';
import {
  AppMonitorComponentTypes,
  IApplicationMonitorComponentState,
} from '../app-action-monitor-icon/app-action-monitor-icon.component';
import { ITableListDataSource } from '../list/data-sources-controllers/list-data-source-types';
import {
  ITableCellRequestMonitorIconConfig,
  TableCellRequestMonitorIconComponent,
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
    const getCellConfig = () => ({
      entityKey: this.entityKey,
      schema: this.schema,
      monitorState: this.monitorState,
      updateKey: this.updateKey,
      getId: this.getId
    });
    const monitorColumn = {
      columnId: 'monitorState',
      cellComponent: TableCellRequestMonitorIconComponent,
      cellConfig: this.getCellConfig || getCellConfig,
      cellFlex: '0 0 40px'
    };

    this.allColumns = [...this.columns, monitorColumn];
    this.dataSource = {
      connect: () => this.data$,
      disconnect: () => { },
      trackBy: (index, item) => {
        const fn = monitorColumn.cellConfig(item).getId;
        if (fn) {
          return fn(item);
        } else if (this.getId) {
          return this.getId(item);
        }
        return this.trackBy(index, item);
      },
      isTableLoading$: observableOf(false)
    } as ITableListDataSource<T>;
  }

}
