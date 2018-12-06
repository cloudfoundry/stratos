import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfSpaceCardComponent } from './cf-space-card/cf-space-card.component';
import { CfSpacesDataSourceService } from './cf-spaces-data-source.service';
import { ITableColumn } from '../../list-table/table.types';
import { ISpace } from '../../../../../core/cf-api.types';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';

@Injectable()
export class CfSpacesListConfigService implements IListConfig<APIResource> {
  viewType = ListViewTypes.CARD_ONLY;
  dataSource: CfSpacesDataSourceService;
  cardComponent = CfSpaceCardComponent;
  defaultView = 'cards' as ListView;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no spaces'
  };
  columns: ITableColumn<APIResource<ISpace>>[] = [{
    columnId: 'name',
    headerCell: () => 'Name',
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.name'
    }
  }, {
    columnId: 'createdAt',
    headerCell: () => 'Creation',
    sort: {
      type: 'sort',
      orderKey: 'createdAt',
      field: 'metadata.created_at'
    },
  }];

  constructor(
    private store: Store<AppState>,
    cfOrgService: CloudFoundryOrganizationService,
  ) {
    this.dataSource = new CfSpacesDataSourceService(cfOrgService.cfGuid, cfOrgService.orgGuid, this.store, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
