import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ITableColumn } from '../../list-table/table.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfQuotaCardComponent } from './cf-quota-card/cf-quota-card.component';
import { CfQuotasDataSourceService } from './cf-quotas-data-source.service';

@Injectable()
export class CfQuotasListConfigService extends BaseCfListConfig<APIResource<IQuotaDefinition>> {
  dataSource: CfQuotasDataSourceService;
  cardComponent = CfQuotaCardComponent;
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
    this.dataSource = new CfQuotasDataSourceService(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
