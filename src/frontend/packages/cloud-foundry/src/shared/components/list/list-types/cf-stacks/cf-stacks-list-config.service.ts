import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfStacksCardComponent } from './cf-stacks-card/cf-stacks-card.component';
import { CfStacksDataSource } from './cf-stacks-data-source';

@Injectable({
  providedIn: 'root'
})
export class CfStacksListConfigService extends BaseCfListConfig<APIResource<any>> {
  private store = inject(Store<CFAppState>);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

  dataSource: CfStacksDataSource;
  cardComponent = CfStacksCardComponent;
  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Search by name',
    noEntries: 'There are no stacks'
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
    this.dataSource = new CfStacksDataSource(this.store, this.activeRouteCfOrgSpace.cfGuid, this);
  }

  getDataSource = () => this.dataSource;
  getColumns = () => this.columns;
}
