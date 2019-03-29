import { Injectable, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { getFullEndpointApiUrl } from '../../../features/endpoints/endpoint-helpers';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  EndpointCardComponent,
} from '../../../shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  TableCellEndpointStatusComponent,
} from '../../../shared/components/list/list-types/endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { MonocularRepositoryDataSource } from './monocular-repository-list-source';

@Injectable()
export class MonocularRepositoryListConfig implements IListConfig<EndpointModel> {
  isLocal = true;
  dataSource: MonocularRepositoryDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Repositories',
    noEntries: 'There are no repositories'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'address',
      headerCell: () => 'Address',
      cellDefinition: {
        getValue: getFullEndpointApiUrl
      },
      sort: {
        type: 'sort',
        orderKey: 'address',
        field: 'api_endpoint.Host'
      },
      cellFlex: '7'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellComponent: TableCellEndpointStatusComponent,
      cellConfig: {
        showLabel: true
      },
      cellFlex: '2'
    },
  ] as ITableColumn<EndpointModel>[];

  // private handleAction(item, effectKey, handleChange) {
  //   const disSub = this.store.select(selectUpdateInfo(
  //     endpointStoreNames.type,
  //     item.guid,
  //     effectKey,
  //   )).pipe(
  //     pairwise())
  //     .subscribe(([oldVal, newVal]) => {
  //       if (!newVal.error && (oldVal.busy && !newVal.busy)) {
  //         handleChange([oldVal, newVal]);
  //         disSub.unsubscribe();
  //       }
  //     });
  // }

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    ngZone: NgZone
  ) {
    const highlighted = activatedRoute.snapshot.params.guid;
    this.dataSource = new MonocularRepositoryDataSource(
      this.store,
      this,
      highlighted,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      ngZone
    );
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
