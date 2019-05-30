import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ITableColumn } from '../../list-table/table.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfSpaceQuotaCardComponent } from './cf-space-quota-card/cf-space-quota-card.component';
import { CfOrgSpaceQuotasDataSourceService } from './cf-space-quotas-data-source.service';

@Injectable()
export class CfOrgSpaceQuotasListConfigService extends BaseCfListConfig<APIResource<IQuotaDefinition>> {
  dataSource: CfOrgSpaceQuotasDataSourceService;
  cardComponent = CfSpaceQuotaCardComponent;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no quotas'
  };
  columns: ITableColumn<APIResource<IQuotaDefinition>>[] = [{
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

  constructor(private store: Store<AppState>, activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfOrgSpaceQuotasDataSourceService(this.store, activeRouteCfOrgSpace.orgGuid, activeRouteCfOrgSpace.cfGuid, this);
  }

  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
