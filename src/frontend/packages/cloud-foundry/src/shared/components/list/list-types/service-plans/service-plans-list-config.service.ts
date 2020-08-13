import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { getServicePlanName } from '../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { ServicesService } from '../../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import {
  IListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
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
@Injectable()
export class ServicePlansListConfigService implements IListConfig<APIResource<IServicePlan>> {

  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource: IListDataSource<APIResource<IServicePlan>>;
  defaultView = 'table' as ListView;
  text = {
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
        getValue: (row) => getServicePlanName(row.entity)
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
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
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

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
