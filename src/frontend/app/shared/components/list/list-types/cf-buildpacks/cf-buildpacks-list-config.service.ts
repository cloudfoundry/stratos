import { Injectable } from '@angular/core';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { CfBuildpacksDataSource } from './cf-buildpacks-data-source';
import { CfBuildpackCardComponent } from './cf-buildpack-card/cf-buildpack-card.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';

@Injectable()
export class CfBuildpacksListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: CfBuildpacksDataSource;
  constructor(private store: Store<AppState>, private baseCF: BaseCF) {
    super();
    this.dataSource = new CfBuildpacksDataSource(this.store, baseCF.guid, this);
    this.cardComponent = CfBuildpackCardComponent;
  }
  getDataSource = () => this.dataSource;
}
