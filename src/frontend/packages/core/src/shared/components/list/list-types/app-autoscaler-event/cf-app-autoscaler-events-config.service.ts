import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { DatePipe } from '@angular/common';
import { AppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ITimeRange, MetricQueryType } from '../../../../../shared/services/metrics-range-selector.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppAutoscalerEventsDataSource } from './cf-app-autoscaler-events-data-source';
import {
  TableCellAutoscalerEventChangeComponent,
} from './table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusComponent,
} from './table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';

@Injectable()
export class CfAppAutoscalerEventsConfigService extends ListConfig<APIResource> implements IListConfig<APIResource> {
  autoscalerEventSource: CfAppAutoscalerEventsDataSource;
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'timestamp',
      headerCell: () => 'Timestamp',
      cellDefinition: {
        getValue: row => this.datePipe.transform(row.entity.timestamp / 1000000, 'medium')
      },
      sort: true,
      cellFlex: '3'
    },
    {
      columnId: 'status', headerCell: () => 'Status', cellComponent: TableCellAutoscalerEventStatusComponent, cellFlex: '2'
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        getValue: row => row.entity.scaling_type === 0 ? 'dynamic' : 'schedule'
      },
      cellFlex: '2'
    },
    {
      columnId: 'change', headerCell: () => 'Instance Change', cellComponent: TableCellAutoscalerEventChangeComponent, cellFlex: '2'
    },
    {
      columnId: 'action',
      headerCell: () => 'Action',
      cellDefinition: {
        getValue: row => {
          if (row.entity.message) {
            const change = row.entity.new_instances - row.entity.old_instances;
            if (change >= 0) {
              return '+' + change + ' instance(s) because ' + row.entity.message;
            } else {
              return change + ' instance(s) because ' + row.entity.message;
            }
          } else {
            return row.entity.reason;
          }
        }
      },
      cellFlex: '4'
    },
    {
      columnId: 'error',
      headerCell: () => 'Error',
      cellDefinition: {
        getValue: row => row.entity.error
      },
      cellFlex: '4'
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

  constructor(private store: Store<AppState>, private appService: ApplicationService, private datePipe: DatePipe) {
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
