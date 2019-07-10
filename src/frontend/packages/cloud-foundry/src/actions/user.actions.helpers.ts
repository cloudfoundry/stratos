import { cfUserEntityType } from '../cf-entity-factory';
import { createEntityRelationKey } from '../../../store/src/helpers/entity-relations/entity-relations.types';
import { CfUserRoleParams } from '../../../store/src/types/user.types';

export function createDefaultUserRelations() {
  return [
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.ORGANIZATIONS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.AUDITED_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.MANAGED_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.BILLING_MANAGER_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.SPACES),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.MANAGED_SPACES),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.AUDITED_SPACES)
  ];
}
