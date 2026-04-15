import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { differenceInMilliseconds, isBefore } from 'date-fns';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListConfig, ListViewTypes } from '../../../../../core/src/shared/components/list/list.component.types';

import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { ITimeRange } from '../../../../../core/src/shared/services/metrics-range-selector.types';
import { APIResource } from '../../../../../store/src/types/api.types';
import { MetricQueryType } from '../../../../../store/src/types/metric.types';
import { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { CfAppAutoscalerEventsDataSource } from './cf-app-autoscaler-events-data-source';
import {
  TableCellAutoscalerEventChangeComponent,
} from './table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusComponent,
} from './table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';

@Injectable({
  providedIn: 'root'
})
export class CfAppAutoscalerEventsConfigService
  extends ListConfig<APIResource<AppAutoscalerEvent>>
  implements IListConfig<APIResource<AppAutoscalerEvent>> {
  private store = inject<Store<CFAppState>>(Store);
  private appService = inject(ApplicationService);
  private datePipe = inject(DatePipe);

  autoscalerEventSource: CfAppAutoscalerEventsDataSource;
  columns: Array<ITableColumn<APIResource<AppAutoscalerEvent>>> = [
    {
      columnId: 'timestamp',
      headerCell: () => 'Timestamp',
      cellDefinition: {
        getValue: (row: APIResource<AppAutoscalerEvent>) => this.datePipe.transform(row.entity.timestamp / 1000000, 'medium')
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
        getValue: (row: APIResource<AppAutoscalerEvent>) => row.entity.scaling_type === 0 ? 'dynamic' : 'schedule'
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
        getValue: (row: APIResource<AppAutoscalerEvent>) => {
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
        valuePath: 'entity.error'
      },
      cellFlex: '4'
    },
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null as string | null,
    noEntries: 'There are no scaling events'
  };
  isLocal = false;

  showCustomTime = true;
  customTimePollingInterval = 30000;
  customTimeInitialValue = '1:month';
  customTimeWindows: ITimeRange[] = [
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

  private thirtyDays = 1000 * 60 * 60 * 24 * 30;
  customTimeValidation = (start: Date | null, end: Date | null): string | null => {
    if (!end || !start) {
      return null;
    }
    if (!isBefore(start, end)) {
      return 'Start date must be before end date.';
    }
    if (differenceInMilliseconds(new Date(), start) > this.thirtyDays) {
      return 'Only recent 30 days data are support to be query.';
    }
    return null;
  }

  constructor() {
    const metricsRangeService = inject(MetricsRangeSelectorService);

    super();
    this.autoscalerEventSource = new CfAppAutoscalerEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
      this,
      metricsRangeService
    );
  }

  getGlobalActions = (): IGlobalListAction<APIResource<AppAutoscalerEvent>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<AppAutoscalerEvent>>[] => [];
  getSingleActions = (): IListAction<APIResource<AppAutoscalerEvent>>[] => [];
  getColumns = (): ITableColumn<APIResource<AppAutoscalerEvent>>[] => this.columns;
  getDataSource = () => this.autoscalerEventSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
}
