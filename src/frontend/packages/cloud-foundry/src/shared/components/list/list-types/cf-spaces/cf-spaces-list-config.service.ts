import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState, ISpace } from '@stratosui/cloud-foundry';
import { ITableColumn } from '@stratosui/core';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '@stratosui/core';
import { ListView } from '@stratosui/store';
import { APIResource } from '@stratosui/store';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfSpaceCardComponent } from './cf-space-card/cf-space-card.component';
import { CfSpacesDataSourceService } from './cf-spaces-data-source.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpacesListConfigService implements IListConfig<APIResource<ISpace>> {
  private store = inject<Store<CFAppState>>(Store);

  viewType = ListViewTypes.CARD_ONLY;
  dataSource: CfSpacesDataSourceService;
  cardComponent = CfSpaceCardComponent;
  defaultView = 'cards' as ListView;
  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Filter by Name',
    noEntries: 'There are no spaces'
  };
  columns: ITableColumn<APIResource<ISpace>>[] = [{
    columnId: 'name',
    headerCell: () => 'Name',
    sort: {
      type: 'natural-sort',
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

  constructor() {
    const cfOrgService = inject(CloudFoundryOrganizationService);

    this.dataSource = new CfSpacesDataSourceService(cfOrgService.cfGuid, cfOrgService.orgGuid, this.store, this);
  }

  getColumns = (): ITableColumn<APIResource<ISpace>>[] => this.columns;
  getGlobalActions = (): IGlobalListAction<APIResource<ISpace>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<ISpace>>[] => [];
  getSingleActions = (): IListAction<APIResource<ISpace>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getDataSource = (): CfSpacesDataSourceService => this.dataSource;
}
