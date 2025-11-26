import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { CFAppState, ISpace } from '@stratosui/cloud-foundry';
import type { ITableColumn } from '@stratosui/core';
import { type IGlobalListAction, type IListAction, type IListConfig, type IListMultiFilterConfig, type IMultiListAction, ListViewTypes } from '@stratosui/core';
import type { ListView, GeneralEntityAppState } from '@stratosui/store';
import type { APIResource } from '@stratosui/store';
import type { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfSpaceCardComponent } from './cf-space-card/cf-space-card.component';
import { CfSpacesDataSourceService } from './cf-spaces-data-source.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpacesListConfigService implements IListConfig<APIResource<ISpace>> {
  viewType = ListViewTypes.CARD_ONLY;
  dataSource: CfSpacesDataSourceService;
  cardComponent = CfSpaceCardComponent;
  defaultView = 'cards' as ListView;
  enableTextFilter = true;
  text = {
    title: null as string | null,
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
    private store: Store<GeneralEntityAppState>,
    cfOrgService: CloudFoundryOrganizationService,
  ) {
    this.dataSource = new CfSpacesDataSourceService(cfOrgService.cfGuid, cfOrgService.orgGuid, this.store, this);
  }

  getColumns = (): ITableColumn<APIResource<ISpace>>[] => this.columns;
  getGlobalActions = (): IGlobalListAction<APIResource<ISpace>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<ISpace>>[] => [];
  getSingleActions = (): IListAction<APIResource<ISpace>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getDataSource = (): any => this.dataSource as any;
}
