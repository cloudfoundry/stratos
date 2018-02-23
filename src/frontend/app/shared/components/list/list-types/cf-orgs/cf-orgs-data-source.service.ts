import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig } from '../../list.component.types';
import { AppReducersModule } from '../../../../../store/reducers.module';
import { GetAllOrganisations, OrganisationWithSpaceSchema, OrgSpaceRelation } from '../../../../../store/actions/organisation.actions';
import { OrganisationSchema } from '../../../../../store/actions/action-types';
import { SpaceRouteRelation } from '../../../../../store/actions/space.actions';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {
  public static paginationKey = 'cf-organizations';

  constructor(store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const { paginationKey } = CfOrgsDataSourceService;
    const action = new GetAllOrganisations(paginationKey, [OrgSpaceRelation.key, SpaceRouteRelation.key]);
    super({
      store,
      action,
      schema: OrganisationWithSpaceSchema,
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
