import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import { selectUpdateInfo } from '../../../../../store/selectors/api.selectors';
import { EndpointModel, endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { EndpointsListConfigService, endpointColumns } from '../endpoint/endpoints-list-config.service';
import { CaaspEndpointsDataSource } from './caasp-endpoints-data-source';
import { TableCellEndpointStatusComponent } from '../endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { EndpointCardComponent } from '../../list-cards/custom-cards/endpoint-card/endpoint-card.component';


function getEndpointTypeString(endpoint: EndpointModel): string {
  return endpoint.cnsi_type === 'caasp' ? 'CaaSP' : endpoint.cnsi_type;
}

@Injectable()
export class CaaspEndpointsListConfigService implements IListConfig<EndpointModel> {
  columns: ITableColumn<EndpointModel>[];
  isLocal = true;
  dataSource: CaaspEndpointsDataSource;
  pageSizeOptions = [9, 18, 27];
  viewType = ListViewTypes.CARD_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;

  private handleAction(item, effectKey, handleChange) {
    const disSub = this.store.select(selectUpdateInfo(
      endpointStoreNames.type,
      item.guid,
      effectKey,
    ))
      .pairwise()
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog
  ) {
    this.columns = endpointColumns.filter(column => {
      return column.columnId !== 'type';
    });
    this.dataSource = new CaaspEndpointsDataSource(this.store, this);
  }
  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;


}
