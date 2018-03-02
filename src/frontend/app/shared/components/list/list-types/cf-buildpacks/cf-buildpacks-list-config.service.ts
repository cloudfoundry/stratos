import { Injectable } from '@angular/core';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { CfBuildpacksDataSource } from './cf-buildpacks-data-source';
import { CfBuildpackCardComponent } from './cf-buildpack-card/cf-buildpack-card.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';

@Injectable()
export class CfBuildpacksListConfigService implements IListConfig<APIResource> {
  isLocal?: boolean;
  viewType = ListViewTypes.CARD_ONLY;
  enableTextFilter = false;
  tableFixedRowHeight?: boolean;
  dataSource: CfBuildpacksDataSource;
  pageSizeOptions = [9, 45, 90];
  cardComponent = CfBuildpackCardComponent;
  defaultView = 'cards' as ListView;
  getColumns = () => [];

  constructor(private store: Store<AppState>, private baseCF: BaseCF) {
    this.dataSource = new CfBuildpacksDataSource(this.store, baseCF.guid, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
