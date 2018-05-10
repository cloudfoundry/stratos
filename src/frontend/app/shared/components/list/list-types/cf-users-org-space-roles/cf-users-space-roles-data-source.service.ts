import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  entityFactory,
  cfUserSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource, DataFunction, DataFunctionDefinition } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAllOrganizationSpaces } from '../../../../../store/actions/organization.actions';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { OperatorFunction } from 'rxjs/interfaces';

export class CfUsersSpaceRolesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, spaceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = cfUserSchemaKey + '-' + orgGuid;
    const action = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, []);
    const transformEntities: (DataFunction<APIResource> | DataFunctionDefinition)[] = [{ type: 'filter', field: 'entity.name' }];
    if (spaceGuid) {
      transformEntities.push((entities: APIResource[], paginationState: PaginationEntityState) => {
        return entities.filter(e => {
          const validSpace = !(spaceGuid && spaceGuid !== e.metadata.guid);
          return validSpace;
        });
      });
    }
    super({
      store,
      action,
      schema: entityFactory(spaceSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities,
      listConfig
    });
  }
}
