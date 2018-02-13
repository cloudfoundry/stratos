import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import {
  OrganizationSchema,
  GetAllOrganizations
} from '../../../../../store/actions/organization.actions';
import { IListConfig } from '../../list.component.types';
import { AppReducersModule } from '../../../../../store/reducers.module';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {
  public static paginationKey = 'cf-organizations';

  constructor(store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const { paginationKey } = CfOrgsDataSourceService;
    const action = new GetAllOrganizations(paginationKey);
    super({
      store,
      action,
      schema: OrganizationSchema,
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
