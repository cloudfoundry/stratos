import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig } from '../../list.component.types';
import { AppReducersModule } from '../../../../../store/reducers.module';
import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { OrganisationSchema, OrganisationWithSpaceSchema, ServiceSchema } from '../../../../../store/actions/action-types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetAllServices } from '../../../../../store/actions/service.actions';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = 'cf-services';
    const action = new GetAllServices(paginationKey);
    super({
      store,
      action,
      schema: ServiceSchema,
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const cfGuid = paginationState.clientPagination.filter.items['cf'];
          return entities.filter(e => {
            const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
            return validCF;
          });
        }
      ],
      listConfig
    });
  }
}
