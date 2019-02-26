import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of as observableOf } from 'rxjs';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppState } from '../../../../../store/app-state';
import { EntityInfo } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListConfig, ListViewTypes, IListMultiFilterConfig } from '../../list.component.types';
import { CfAppAutoscalerEventsDataSource } from './cf-app-autoscaler-events-data-source';
import { TableCellAutoscalerEventActionComponent } from './table-cell-autoscaler-event-action/table-cell-autoscaler-event-action.component';
import {
  TableCellAutoscalerEventTimestampComponent
} from './table-cell-autoscaler-event-timestamp/table-cell-autoscaler-event-timestamp.component';
import { TableCellAutoscalerEventTypeComponent } from './table-cell-autoscaler-event-type/table-cell-autoscaler-event-type.component';
import { TableCellAutoscalerEventStatusComponent } from './table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import { TableCellAutoscalerEventChangeComponent } from './table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import { TableCellAutoscalerEventErrorComponent } from './table-cell-autoscaler-event-error/table-cell-autoscaler-event-error.component';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { selectPaginationState } from '../../../../../store/selectors/pagination.selectors';
import { filter, first } from 'rxjs/operators';
import { SetClientFilter } from '../../../../../store/actions/pagination.actions';

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
  private multiFilterConfigs: IListMultiFilterConfig[];

  constructor(private store: Store<AppState>, private appService: ApplicationService) {
    super();
    this.autoscalerEventSource = new CfAppAutoscalerEventsDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );

    this.assignMultiConfig();
    this.initialiseMultiFilter(this.autoscalerEventSource.action);
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.autoscalerEventSource;
  getMultiFiltersConfigs = () => this.multiFilterConfigs;

  private assignMultiConfig = () => {
    this.multiFilterConfigs = [
      {
        key: 'queryRange',
        label: 'Last week',
        allLabel: 'Last week',
        list$: observableOf([
          {
            label: 'Last month',
            item: 'month',
            value: 'month'
          },
          {
            label: 'Custom range',
            item: 'custom',
            value: 'custom'
          }
        ]),
        loading$: observableOf(false),
        select: new BehaviorSubject('month')
      }
    ];
  }

  private initialiseMultiFilter(action: PaginatedAction) {
    this.store.select(selectPaginationState(action.entityKey, action.paginationKey)).pipe(
      filter((pag) => !!pag),
      first(),
    ).subscribe(pag => {
      const currentFilter = pag.clientPagination.filter.items['queryRange'];
      if (!currentFilter) {
        this.store.dispatch(new SetClientFilter(action.entityKey, action.paginationKey, {
          string: '',
          items: {
            ['queryRange']: 'week'
          }
        }));
      }
    });
  }

}
