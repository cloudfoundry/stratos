import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
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
import { APIResource, ListView } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { getServicePlanName } from '../../../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { IServicePlan } from '../../../../../cf-api-svc.types';
import { ServicePlansDataSource } from './service-plans-data-source';
import {
  TableCellAServicePlanExtrasComponent,
} from './table-cell-service-plan-extras/table-cell-service-plan-extras.component';
import {
  TableCellAServicePlanPriceComponent,
} from './table-cell-service-plan-price/table-cell-service-plan-price.component';
import {
  TableCellAServicePlanPublicComponent,
} from './table-cell-service-plan-public/table-cell-service-plan-public.component';


/**
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class ServicePlansListConfigService implements IListConfig<APIResource<IServicePlan>> {

  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource: IListDataSource<APIResource<IServicePlan>>;
  defaultView = 'table' as ListView;
  text: { title: string | null; filter: string; noEntries: string } = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no service plans'
  };
  enableTextFilter = true;

  protected columns: ITableColumn<APIResource<IServicePlan>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row: APIResource<IServicePlan>) => getServicePlanName(row.entity)
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'entity.name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'description',
      headerCell: () => 'Description',
      cellDefinition: {
        valuePath: 'entity.description'
      },
      cellFlex: '3'
    },
    {
      columnId: 'public',
      headerCell: () => 'Public',
      cellComponent: TableCellAServicePlanPublicComponent,
      cellFlex: '2'
    },
    {
      columnId: 'Cost',
      headerCell: () => 'Cost',
      cellComponent: TableCellAServicePlanPriceComponent,
      cellFlex: '2'
    },
    {
      columnId: 'addInfo',
      headerCell: () => 'Additional Information',
      cellComponent: TableCellAServicePlanExtrasComponent,
      cellFlex: '2'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource<IServicePlan>) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '2'
    },
  ];


  constructor(
    store: Store<CFAppState>,
    protected datePipe: DatePipe,
    servicesService: ServicesService
  ) {
    this.dataSource = new ServicePlansDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
  }

  getGlobalActions = (): IGlobalListAction<APIResource<IServicePlan>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<IServicePlan>>[] => [];
  getSingleActions = (): IListAction<APIResource<IServicePlan>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getColumns = (): ITableColumn<APIResource<IServicePlan>>[] => this.columns;
  getDataSource = (): import('../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types').IListDataSource<APIResource<IServicePlan>> => this.dataSource;
}
