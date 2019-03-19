import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppState } from '../../../../../../../store/src/app-state';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppAutoscalerEventsDataSource } from './cf-app-autoscaler-events-data-source';
import { TableCellAutoscalerEventActionComponent } from './table-cell-autoscaler-event-action/table-cell-autoscaler-event-action.component';
import {
  TableCellAutoscalerEventTimestampComponent
} from './table-cell-autoscaler-event-timestamp/table-cell-autoscaler-event-timestamp.component';
import { TableCellAutoscalerEventTypeComponent } from './table-cell-autoscaler-event-type/table-cell-autoscaler-event-type.component';
import { TableCellAutoscalerEventStatusComponent } from './table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import { TableCellAutoscalerEventChangeComponent } from './table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import { TableCellAutoscalerEventErrorComponent } from './table-cell-autoscaler-event-error/table-cell-autoscaler-event-error.component';
import { ITimeRange, MetricQueryType } from '../../../../../shared/services/metrics-range-selector.types';

@Injectable()
export class CfAppAutoscalerEventsConfigService extends ListConfig<EntityInfo> implements IListConfig<EntityInfo> {
  autoscalerEventSource: CfAppAutoscalerEventsDataSource;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'timestamp', headerCell: () =>
        'Timestamp', cellComponent: TableCellAutoscalerEventTimestampComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'status', headerCell: () => 'Status', cellComponent: TableCellAutoscalerEventStatusComponent, cellFlex: '2'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellAutoscalerEventTypeComponent, cellFlex: '2'
    },
    {
      columnId: 'change', headerCell: () => 'Instance Change', cellComponent: TableCellAutoscalerEventChangeComponent, cellFlex: '2'
    },
    {
      columnId: 'action', headerCell: () => 'Action', cellComponent: TableCellAutoscalerEventActionComponent, cellFlex: '4'
    },
    {
      columnId: 'error', headerCell: () => 'Error', cellComponent: TableCellAutoscalerEventErrorComponent, cellFlex: '4'
    },
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no scale events'
  };

  showMetricsRange = true;
  pollInterval = 120000;
  selectedTimeValue = '1:week';
  times: ITimeRange[] = [
    {
      value: '1:day',
      label: 'The past day',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:week',
      label: 'The past week',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:month',
      label: 'The past month',
      queryType: MetricQueryType.QUERY
    },
    {
      label: 'Custom time window',
      queryType: MetricQueryType.RANGE_QUERY
    }
  ];

  constructor(private store: Store<AppState>, private appService: ApplicationService) {
    super();
    this.autoscalerEventSource = new CfAppAutoscalerEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.autoscalerEventSource;
  getMultiFiltersConfigs = () => [];
}
