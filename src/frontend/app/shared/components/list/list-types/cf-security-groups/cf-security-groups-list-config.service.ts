import { Injectable } from '@angular/core';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListView } from '../../../../../store/actions/list.actions';
import { CfSecurityGroupsDataSource } from './cf-security-groups-data-source';
import {
  CfSecurityGroupsCardComponent,
} from '../../list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfSecurityGroupsListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: CfSecurityGroupsDataSource;
  cardComponent = CfSecurityGroupsCardComponent;

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfSecurityGroupsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getDataSource = () => this.dataSource;
}
