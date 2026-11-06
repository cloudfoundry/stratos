/**
 * CF user relation bucket types — the keys of the
 * GET /pp/v1/cf/current-user-roles/:cnsiGuid response (handler:
 * getNativeCurrentUserRoles). Consumed by the signal-native CF roles fetch +
 * transforms (cf-user-roles-fetch / cf-roles-state.helpers).
 *
 * The former ngrx action classes (GetCfUserRelations,
 * GetCurrentCfUserRelationsComplete) and GET_* constants were removed with the
 * CF roles reducer (favorites/roles island, Wave 2).
 */
export enum CfUserRelationTypes {
  AUDITED_ORGANIZATIONS = 'audited_organizations',
  BILLING_MANAGED_ORGANIZATION = 'billing_managed_organizations',
  MANAGED_ORGANIZATION = 'managed_organizations',
  ORGANIZATIONS = 'organizations',
  AUDITED_SPACES = 'audited_spaces',
  MANAGED_SPACES = 'managed_spaces',
  SPACES = 'spaces',
  SUPPORTED_SPACES = 'supported_spaces',
}
