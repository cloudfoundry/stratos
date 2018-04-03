import { Injectable } from '@angular/core';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListView } from '../../../../../store/actions/list.actions';
import { CfStacksDataSource } from './cf-stacks-data-source';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfStacksCardComponent } from './cf-stacks-card/cf-stacks-card.component';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfStacksListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: CfStacksDataSource;
  cardComponent = CfStacksCardComponent;
  text = {
    title: null,
    noEntries: 'There are no stacks'
  };

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfStacksDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getDataSource = () => this.dataSource;
}
