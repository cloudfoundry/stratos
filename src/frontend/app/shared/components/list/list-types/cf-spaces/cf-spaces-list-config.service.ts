import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CloudFoundryOrganisationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organisation.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfSpaceCardComponent } from './cf-space-card/cf-space-card.component';
import { CfSpacesDataSourceService } from './cf-spaces-data-source.service';

@Injectable()
export class CfSpacesListConfigService implements IListConfig<APIResource> {
  viewType = ListViewTypes.CARD_ONLY;
  enableTextFilter = false;
  dataSource: CfSpacesDataSourceService;
  cardComponent = CfSpaceCardComponent;
  defaultView = 'cards' as ListView;
  text = {
    title: null,
    noEntries: 'There are no spaces'
  };

  constructor(private store: Store<AppState>, private cfOrgService: CloudFoundryOrganisationService) {

    this.dataSource = new CfSpacesDataSourceService(cfOrgService.cfGuid, cfOrgService.orgGuid, this.store, this);
  }

  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
