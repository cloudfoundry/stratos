import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import {
  CfSecurityGroupsCardComponent,
} from '../../list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfSecurityGroupsDataSource } from './cf-security-groups-data-source';

@Injectable()
export class CfSecurityGroupsListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: CfSecurityGroupsDataSource;
  cardComponent = CfSecurityGroupsCardComponent;
  text = {
    title: null,
    noEntries: 'There are no security groups'
  };

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfSecurityGroupsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getDataSource = () => this.dataSource;
}
