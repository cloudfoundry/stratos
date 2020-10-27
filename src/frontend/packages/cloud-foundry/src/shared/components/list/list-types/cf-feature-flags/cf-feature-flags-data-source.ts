import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { featureFlagEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { IFeatureFlag } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export const FeatureFlagDescriptions = {
  user_org_creation: 'Any user can create an organization',
  private_domain_creation: ' An Org Manager can create private domains for that organization',
  app_bits_upload: 'Space Developers can upload app bits',
  app_scaling: 'Space Developers can perform scaling operations (i.e. change memory, disk, or instances)',
  route_creation: 'Space Developers can create routes in a space',
  service_instance_creation: 'Space Developers can create service instances in a space',
  diego_docker: 'Space Developers can push Docker apps',
  set_roles_by_username: 'Org Managers and Space Managers can add roles by username',
  unset_roles_by_username: 'Org Managers and Space Managers can remove roles by username',
  task_creation: 'Space Developers can create tasks on their application. This feature is under development',
  env_var_visibility: 'All users can view environment variables',
  space_scoped_private_broker_creation: 'Space Developers can create space-scoped private service brokers',
  space_developer_env_var_visibility:
    'Space Developers can view their v2 environment variables. Org Managers and Space Managers can view their v3 environment variables',
  service_instance_sharing: 'Org and Space Managers can allow service instances to be shared across different spaces.',
  hide_marketplace_from_unauthenticated_users: 'Service offerings available in the marketplace will be hidden from unauthenticated users',
  resource_matching: 'Any user can create resource matches'
};
export class CfFeatureFlagsDataSource extends ListDataSource<IFeatureFlag> {
  static nameColumnId = 'name';
  static descriptionColumnId = 'description';

  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<IFeatureFlag>) {
    const action = cfEntityCatalog.featureFlag.actions.getMultiple(cfGuid);
    super({
      store,
      action,
      schema: cfEntityFactory(featureFlagEntityType),
      getRowUniqueId: (ff) => ff.guid,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [
        ((entities: IFeatureFlag[], paginationState: PaginationEntityState) => {
          if (!paginationState.clientPagination.filter.string) {
            return entities;
          }

          const filterString = paginationState.clientPagination.filter.string.toUpperCase();

          const filterKey = paginationState.clientPagination.filter.filterKey;

          switch (filterKey) {
            case CfFeatureFlagsDataSource.nameColumnId:
              return entities.filter(ff => ff.name.toUpperCase().includes(filterString));
            case CfFeatureFlagsDataSource.descriptionColumnId:
              return entities.filter(ff => {
                const description = FeatureFlagDescriptions[ff.name];
                if (!description) {
                  return false;
                }
                return description.toUpperCase().includes(filterString);
              });
            default:
              return entities;
          }
        })
      ],
      listConfig
    });
  }
}
