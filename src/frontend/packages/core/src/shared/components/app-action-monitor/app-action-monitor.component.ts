import { Component, Input, OnInit } from '@angular/core';
import { schema } from 'normalizr';
import { never as observableNever, Observable, of as observableOf } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { EntitySchema } from '../../../../../store/src/helpers/entity-schema';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { rootUpdatingKey } from '../../../../../store/src/reducers/api-request-reducer/types';
import {
  ActionMonitorComponentState,
  AppMonitorComponentTypes,
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
  public data$: Observable<Array<T>> = observableNever();

  public replayData$: Observable<Array<T>>;

  @Input()
  public entityKey: string;

  @Input()
  public schema: EntitySchema;

  @Input()
  public monitorState: AppMonitorComponentTypes = AppMonitorComponentTypes.FETCHING;

  @Input()
  public updateKey = rootUpdatingKey;

  /**
   * Get the ID of the ENTITY (not table row)
   */
  @Input()
  public getId: (element) => string;

  /**
   * Get the ID of the ROW
   */
  @Input()
  public trackBy = ((index: number, item: T) => index.toString());

  @Input()
  public getCellConfig: (element) => ITableCellRequestMonitorIconConfig;

  @Input()
  public columns: ITableColumn<T>[] = [];

  public dataSource: ITableListDataSource<T>;

  public allColumns: ITableColumn<T>[] = [];

  constructor(
    private entityMonitorFactory: EntityMonitorFactory
  ) {
  }

  ngOnInit() {
    const defaultGetCellConfig = () => ({
      entityKey: this.entityKey,
      schema: this.schema,
      monitorState: this.monitorState,
      updateKey: this.updateKey,
      getId: this.getId
    });
    const monitorColumn = {
      columnId: 'monitorState',
      cellComponent: TableCellRequestMonitorIconComponent,
      cellConfig: {
        getConfig: this.getCellConfig || defaultGetCellConfig
      },
      cellFlex: '0 0 24px'
    };

    // Some data$ obs only ever emit once. If we subscribed directly to this then that emit would be consumed and will not be available
    // in the data source connect subscription. So wrap it in a replay to ensure the last emitted value is available
    this.replayData$ = this.data$.pipe(
      publishReplay(1),
      refCount()
    );

    this.allColumns = [...this.columns, monitorColumn];
    this.dataSource = {
      connect: () => this.replayData$,
      disconnect: () => { },
      trackBy: (index, item) => {
        const fn = monitorColumn.cellConfig.getConfig(item).getId;
        if (fn) {
          return fn(item);
        } else if (this.getId) {
          return this.getId(item);
        }
        return this.trackBy(index, item);
      },
      isTableLoading$: observableOf(false),
      getRowState: (row) => {
        // Get the row state of the ENTITY
        const cellConfig = monitorColumn.cellConfig.getConfig(row);
        const monitorState = new ActionMonitorComponentState(
          this.entityMonitorFactory,
          cellConfig.getId(row),
          cellConfig.schema,
          cellConfig.monitorState,
          cellConfig.updateKey,
        );
        return monitorState.currentState.pipe(
          map(state => {
            return {
              busy: state.busy,
              error: state.error,
              message: state.message,
              highlighted: false,
            };
          })
        );
      }
    };
  }


}
