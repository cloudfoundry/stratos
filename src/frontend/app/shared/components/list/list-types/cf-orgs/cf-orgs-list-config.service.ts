import { Injectable } from '@angular/core';

import { APIResource } from '../../../../../store/types/api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { ITableColumn, ITableText } from '../../list-table/table.types';
import {
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes
} from '../../list.component.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { CfOrgCardComponent } from './cf-org-card/cf-org-card.component';
import { CfOrgsDataSourceService } from './cf-orgs-data-source.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
@Injectable()
export class CfOrgsListConfigService implements IListConfig<APIResource> {
  isLocal?: boolean;
  pageSizeOptions: Number[];
  viewType = ListViewTypes.CARD_ONLY;
  enableTextFilter = false;
  tableFixedRowHeight?: boolean;
  dataSource: CfOrgsDataSourceService;

  cardComponent = CfOrgCardComponent;
  defaultView = 'cards' as ListView;
  getColumns = () => [];

  constructor(private store: Store<AppState>) {
    this.dataSource = new CfOrgsDataSourceService(this.store, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
