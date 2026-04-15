import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take, distinctUntilChanged, map } from 'rxjs/operators';

import { ITableColumn, IListConfig, ListConfig, ListViewTypes } from '@stratosui/core';
import { AddParams, APIResource, PaginatedAction } from '@stratosui/store';
import { CfEvent } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { QParam, QParamJoiners } from '../../../../q-param';
import { CfEventsDataSource } from './cf-events-data-source';
import { TableCellEventActeeComponent } from './table-cell-event-actee/table-cell-event-actee.component';
import { TableCellEventActionComponent } from './table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from './table-cell-event-detail/table-cell-event-detail.component';
import { TableCellEventTimestampComponent } from './table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from './table-cell-event-type/table-cell-event-type.component';

export class CfEventsConfigService extends ListConfig<APIResource> implements IListConfig<APIResource<CfEvent>> {

  static acteeColumnId = 'actee';
  eventSource: CfEventsDataSource;

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'actor', headerCell: () => 'Actor', cellComponent: TableCellEventActionComponent, cellFlex: '2'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '2'
    },
    {
      columnId: CfEventsConfigService.acteeColumnId,
      headerCell: () => 'Actee',
      cellComponent: TableCellEventActeeComponent,
      cellFlex: '3',
      cellConfig: {
        setActeeFilter: (actee: string) => this.setActeeFilter(actee)
      }
    },
    {
      columnId: 'detail', headerCell: () => 'Detail', cellComponent: TableCellEventDetailComponent, cellFlex: '6'
    },
    {
      columnId: 'timestamp', headerCell: () => 'Timestamp', cellComponent: TableCellEventTimestampComponent, sort: true, cellFlex: '3'
    },
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = [10, 25, 50, 100];
  text = {
    title: null as string,
    noEntries: 'There are no events'
  };

  constructor(
    private store: Store<CFAppState>,
    cfGuid?: string,
    orgGuid?: string,
    spaceGuid?: string,
    public acteeGuid?: string,
  ) {
    super();
    if (acteeGuid) {
      this.columns = this.columns.filter(column => column.columnId !== CfEventsConfigService.acteeColumnId);
    }

    this.eventSource = new CfEventsDataSource(
      store,
      cfGuid,
      this,
      orgGuid,
      spaceGuid,
      acteeGuid,
    );
  }

  getGlobalActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IGlobalListAction<APIResource>[] => null;
  getMultiActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IMultiListAction<APIResource>[] => null;
  getSingleActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListAction<APIResource>[] => null;
  getColumns = (): ITableColumn<APIResource>[] => this.columns;
  getDataSource = (): CfEventsDataSource => this.eventSource;
  getMultiFiltersConfigs = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListMultiFilterConfig[] => [];

  setActeeFilter(actee: string): void {
    this.getEventFilters().pipe(
      take(1)
    ).subscribe(currentFilters => {
      this.setEventFilters({
        actee,
        type: currentFilters.type
      });
    });
  }

  setEventFilters(values: { actee: string, type: string[] }): void {
    const action = this.eventSource.action as PaginatedAction;
    const newQ: string[] = [];
    if (values.type && values.type.length) {
      newQ.push(new QParam('type', values.type, QParamJoiners.in).toString());
    }
    if (values.actee && values.actee.length) {
      newQ.push(new QParam('actee', values.actee, QParamJoiners.in).toString());
    }
    this.store.dispatch(new AddParams(action, this.eventSource.paginationKey, { q: newQ }));
  }

  getEventFilters(): Observable<{
    type: string[],
    actee: string }> {
    return this.getDataSource().pagination$.pipe(
      distinctUntilChanged(),
      map(pag => QParam.fromStrings(pag.params.q as string[])),
      map(qParams => {
        const qType = qParams.find(qParam => qParam.key === 'type');
        const qActee = qParams.find(qParam => qParam.key === 'actee');
        return {
          type: qType ? (qType.value as string).split(',') : [],
          actee: qActee ? qActee.value as string : undefined
        };
      })
    );
  }
}
