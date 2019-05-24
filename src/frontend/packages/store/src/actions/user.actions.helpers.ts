import { createEntityRelationKey } from '../helpers/entity-relations/entity-relations.types'
import { cfUserSchemaKey } from '../helpers/entity-factory';
import { CfUserRoleParams } from '../types/user.types';

export function createDefaultUserRelations() {
  return [
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.ORGANIZATIONS),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.AUDITED_ORGS),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.MANAGED_ORGS),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.BILLING_MANAGER_ORGS),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.SPACES),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.MANAGED_SPACES),
    createEntityRelationKey(cfUserSchemaKey, CfUserRoleParams.AUDITED_SPACES)
  ];
}