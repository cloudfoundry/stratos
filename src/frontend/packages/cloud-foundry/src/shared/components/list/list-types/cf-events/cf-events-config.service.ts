import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, first, map } from 'rxjs/operators';

import { arraysEqual, valueOrCommonFalsy, type ITableColumn, type IListConfig, ListConfig, ListViewTypes } from '@stratosui/core';
import { AddParams, type APIResource, type PaginatedAction, type GeneralEntityAppState } from '@stratosui/store';
import type { CfEvent } from '../../../../../cf-api.types';
import type { CFAppState } from '../../../../../cf-app-state';
import { QParam, QParamJoiners } from '../../../../q-param';
import { CfEventsDataSource } from './cf-events-data-source';
import { TableCellEventActeeComponent } from './table-cell-event-actee/table-cell-event-actee.component';
import { TableCellEventActionComponent } from './table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from './table-cell-event-detail/table-cell-event-detail.component';
import { TableCellEventTimestampComponent } from './table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from './table-cell-event-type/table-cell-event-type.component';

export class CfEventsConfigService extends ListConfig<APIResource<CfEvent>> implements IListConfig<APIResource<CfEvent>> {

  static acteeColumnId = 'actee';
  eventSource: CfEventsDataSource;

  columns: Array<ITableColumn<APIResource<CfEvent>>> = [
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
  text = {
    title: null as string,
    noEntries: 'There are no events'
  };

  constructor(
    private store: Store<GeneralEntityAppState>,
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

  getGlobalActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IGlobalListAction<APIResource<CfEvent>>[] => null;
  getMultiActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IMultiListAction<APIResource<CfEvent>>[] => null;
  getSingleActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListAction<APIResource<CfEvent>>[] => null;
  getColumns = (): ITableColumn<APIResource<CfEvent>>[] => this.columns;
  getDataSource = (): CfEventsDataSource => this.eventSource;
  getMultiFiltersConfigs = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListMultiFilterConfig[] => [];

  setActeeFilter(actee: string): void {
    this.getEventFilters().pipe(
      first()
    ).subscribe(currentFilters => {
      this.setEventFilters({
        actee,
        type: currentFilters.type
      });
    });
  }

  setEventFilters(values: { actee: string, type: string[] }): void {
    this.getEventFilters().pipe(
      first()
    ).subscribe(currentFilters => {
      const action = this.eventSource.action as PaginatedAction;

      // Recreate the whole q param and set it again using 'AddParams'
      const typeChanged = !arraysEqual(values.type, currentFilters.type);
      const acteeChanged = valueOrCommonFalsy(values.actee) !== valueOrCommonFalsy(currentFilters.actee);
      if (typeChanged || acteeChanged) {
        const newQ: string[] = [];
        if (values.type?.length) {
          newQ.push(new QParam('type', values.type, QParamJoiners.in).toString());
        }
        if (values.actee?.length) {
          newQ.push(new QParam('actee', values.actee, QParamJoiners.in).toString());
        }
        this.store.dispatch(new AddParams(action, this.eventSource.paginationKey, { q: newQ }));
      }
    });
  }

  getEventFilters(): Observable<{
    type: string[],
    actee: string,
  }> {
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
