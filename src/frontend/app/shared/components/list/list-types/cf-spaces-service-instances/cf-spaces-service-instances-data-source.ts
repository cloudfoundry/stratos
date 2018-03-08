import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig } from '../../list.component.types';
import { AppReducersModule } from '../../../../../store/reducers.module';
import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { OrganisationSchema, OrganisationWithSpaceSchema, ServiceInstancesSchema } from '../../../../../store/actions/action-types';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetServicesInstancesInSpace } from '../../../../../store/actions/service-instances.actions';
import { CfServiceInstance } from '../../../../../store/types/service.types';

export class CfSpacesServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('cf-spaces-service-instances', cfGuid, spaceGuid);
    const action = new GetServicesInstancesInSpace(cfGuid, spaceGuid, paginationKey);
    super({
      store,
      action,
      schema: ServiceInstancesSchema,
      getRowUniqueId: (entity: APIResource<CfServiceInstance>) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
