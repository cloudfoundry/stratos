import { Injectable } from '@angular/core';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { CfBuildpacksDataSource } from './cf-buildpacks-data-source';
import { CfBuildpackCardComponent } from './cf-buildpack-card/cf-buildpack-card.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListView } from '../../../../../store/actions/list.actions';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { IBuildpack } from '../../../../../core/cf-api.types';

@Injectable()
export class CfBuildpacksListConfigService extends BaseCfListConfig<APIResource<IBuildpack>> {
  cardComponent = CfBuildpackCardComponent;
  dataSource: CfBuildpacksDataSource;
  isLocal = false;
  text = {
    title: null,
    noEntries: 'There are no buildpacks'
  };
  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfBuildpacksDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }
  getDataSource = () => this.dataSource;
}
