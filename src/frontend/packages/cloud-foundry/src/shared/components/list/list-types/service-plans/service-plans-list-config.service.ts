import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  defaultPaginationPageSizeOptionsTable,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListDataSource,
  IListMultiFilterConfig,
  IMultiListAction,
  ITableColumn,
  ListViewTypes,
} from '@stratosui/core';
import { ListView } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { getServicePlanName } from '../../../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { StServicePlan } from '../../../../../services/endpoint-data/stratos-types';
import { ServicePlansDataSource } from './service-plans-data-source';
import {
  TableCellAServicePlanPriceComponent,
} from './table-cell-service-plan-price/table-cell-service-plan-price.component';
import {
  TableCellAServicePlanPublicComponent,
} from './table-cell-service-plan-public/table-cell-service-plan-public.component';

/**
 * Offering-detail Plans tab list config. Rows are StServicePlan (the V3
 * nested-ref shape); the underlying data source adapts the legacy ngrx
 * APIResource<IServicePlan> wire to StServicePlan in transformEntities.
 *
 * The V3 shape doesn't surface the open-service-broker `extraTyped.bullets`
 * field, so the legacy "Additional Information" column is dropped. Reinstate
 * when StServicePlan projects broker_catalog.metadata.
 */
@Injectable({
  providedIn: 'root',
})
export class ServicePlansListConfigService implements IListConfig<StServicePlan> {
  protected datePipe = inject(DatePipe);

  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource: IListDataSource<StServicePlan>;
  defaultView = 'table' as ListView;
  text: { title: string | null; filter: string; noEntries: string } = {
    title: null,
    filter: 'Filter by Name',
    noEntries: 'There are no service plans',
  };
  enableTextFilter = true;

  protected columns: ITableColumn<StServicePlan>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row: StServicePlan) => getServicePlanName(row),
      },
      sort: {
        type: 'natural-sort',
        orderKey: 'name',
        field: 'name',
      },
      cellFlex: '2',
    },
    {
      columnId: 'description',
      headerCell: () => 'Description',
      cellDefinition: {
        valuePath: 'description',
      },
      cellFlex: '3',
    },
    {
      columnId: 'public',
      headerCell: () => 'Public',
      cellComponent: TableCellAServicePlanPublicComponent,
      cellFlex: '2',
    },
    {
      columnId: 'Cost',
      headerCell: () => 'Cost',
      cellComponent: TableCellAServicePlanPriceComponent,
      cellFlex: '2',
    },
    {
      columnId: 'creation',
      headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: StServicePlan) => `${this.datePipe.transform(row.createdAt, 'medium')}`,
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'createdAt',
      },
      cellFlex: '2',
    },
  ];

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const servicesService = inject(ServicesService);

    this.dataSource = new ServicePlansDataSource(
      servicesService.cfGuid,
      servicesService.serviceGuid,
      store,
      this,
    );
  }

  getGlobalActions = (): IGlobalListAction<StServicePlan>[] => [];
  getMultiActions = (): IMultiListAction<StServicePlan>[] => [];
  getSingleActions = (): IListAction<StServicePlan>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getColumns = (): ITableColumn<StServicePlan>[] => this.columns;
  getDataSource = (): IListDataSource<StServicePlan> => this.dataSource;
}
