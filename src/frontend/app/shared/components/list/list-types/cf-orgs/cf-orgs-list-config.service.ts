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

  private editOrgAction: IListAction<APIResource> = {
    // Take user to form
    action: (item: APIResource) => this.editOrg(item),
    icon: 'mode_edit',
    label: 'Edit',
    description: 'Edit Organization',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private deleteOrgAction: IListAction<APIResource> = {
    // Take user to form
    action: (item: APIResource) => this.deleteOrg(item),
    icon: 'delete',
    label: 'Delete',
    description: 'Delete Organization',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  cardComponent = CfOrgCardComponent;
  defaultView = 'cards' as ListView;
  getColumns = () => [];

  constructor(private store: Store<AppState>) {
    this.dataSource = new CfOrgsDataSourceService(this.store, this);
  }

  editOrg = (org: APIResource) => {
    // TODO
  };

  deleteOrg = (org: APIResource) => {
    // TODO
  };

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
