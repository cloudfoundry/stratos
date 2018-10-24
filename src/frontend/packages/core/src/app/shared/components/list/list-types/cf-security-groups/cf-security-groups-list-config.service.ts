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
import { ITableColumn } from '../../list-table/table.types';

@Injectable()
export class CfSecurityGroupsListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: CfSecurityGroupsDataSource;
  cardComponent = CfSecurityGroupsCardComponent;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no security groups'
  };
  columns: ITableColumn<APIResource>[] = [{
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

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfSecurityGroupsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
