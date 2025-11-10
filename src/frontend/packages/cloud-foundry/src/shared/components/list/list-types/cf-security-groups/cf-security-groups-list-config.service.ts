import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { ITableColumn } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfSecurityGroupsCardComponent } from './cf-security-groups-card/cf-security-groups-card.component';
import { CfSecurityGroupsDataSource } from './cf-security-groups-data-source';

@Injectable({
  providedIn: 'root'
})
export class CfSecurityGroupsListConfigService extends BaseCfListConfig<APIResource> {
  private store = inject(Store<CFAppState>);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

  dataSource: CfSecurityGroupsDataSource;
  cardComponent = CfSecurityGroupsCardComponent;
  enableTextFilter = true;
  text: { title: string | null; filter: string; noEntries: string } = {
    title: null as string | null,
    filter: 'Search by name',
    noEntries: 'There are no security groups'
  };
  columns: ITableColumn<APIResource<any>>[] = [{
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

  constructor() {
    super();
    this.dataSource = new CfSecurityGroupsDataSource(this.store, this.activeRouteCfOrgSpace.cfGuid!, this as any);
  }

  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
