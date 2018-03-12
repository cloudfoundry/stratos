import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig } from '../../list.component.types';
import { AppReducersModule } from '../../../../../store/reducers.module';
import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { OrganisationSchema, OrganisationWithSpaceSchema } from '../../../../../store/actions/action-types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('cf-organizations', cfGuid);
    const action = new GetAllOrganisations(paginationKey, cfGuid);
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
