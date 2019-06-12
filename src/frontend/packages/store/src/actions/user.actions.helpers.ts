import { cfUserEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { createEntityRelationKey } from '../helpers/entity-relations/entity-relations.types';
import { CfUserRoleParams } from '../types/user.types';

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