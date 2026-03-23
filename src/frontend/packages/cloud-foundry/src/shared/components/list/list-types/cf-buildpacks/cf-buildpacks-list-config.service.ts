import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { ITableColumn } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { IBuildpack } from '../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfBuildpackCardComponent } from './cf-buildpack-card/cf-buildpack-card.component';
import { CfBuildpacksDataSource } from './cf-buildpacks-data-source';

@Injectable({
  providedIn: 'root'
})
export class CfBuildpacksListConfigService extends BaseCfListConfig<APIResource<IBuildpack>> {
  private store = inject(Store<CFAppState>);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

  cardComponent = CfBuildpackCardComponent;
  dataSource: CfBuildpacksDataSource;
  isLocal = true;
  enableTextFilter = true;
  text: { title: string | null; filter: string; noEntries: string } = {
    title: null as string | null,
    filter: 'Filter by Name',
    noEntries: 'There are no buildpacks'
  };
  columns: ITableColumn<APIResource>[] = [{
    columnId: 'position',
    headerCell: () => 'Position',
    sort: {
      type: 'sort',
      orderKey: 'position',
      field: 'entity.position'
    },
  }, {
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
    this.dataSource = new CfBuildpacksDataSource(this.store, this.activeRouteCfOrgSpace.cfGuid, this as BaseCfListConfig<APIResource<IBuildpack>>);
  }
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
