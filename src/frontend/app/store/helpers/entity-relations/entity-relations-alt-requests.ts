// import { Store } from '@ngrx/store';

// import { GetRolesAsNonAdmin } from '../actions/users.actions';
// import { AppState } from '../app-state';
// import { cfUserSchemaKey, organizationSchemaKey, spaceSchemaKey } from './entity-factory';
// import { EntityTreeRelation, ValidateEntityResult, createValidationPaginationWatcher } from './entity-relations.types';


// function createNonAdminFetchRole(store, cfGuid, isAdmin, relationKey): ValidateEntityResult {
//   if (isAdmin) {
//     return null;
//   }
//   const action = { type: '123' }; // GetRolesAsNonAdmin(cfGuid, relationKey);
//   return {
//     action,
//     // fetchingState$: createValidationPaginationWatcher(store, action)
//   };
// }

// const alts: { [parentChildRelkey: string]: (store: Store<AppState>, cfGuid: string, isAdmin: boolean) => ValidateEntityResult } = {
//   [`${cfUserSchemaKey}-${organizationSchemaKey}-organizations`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'organizations'),
//   [`${cfUserSchemaKey}-${organizationSchemaKey}-audited_organizations`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'audited_organizations'),
//   [`${cfUserSchemaKey}-${organizationSchemaKey}-managed_organizations`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'managed_organizations'),
//   [`${cfUserSchemaKey}-${organizationSchemaKey}-billing_managed_organizations`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'billing_managed_organizations'),
//   [`${cfUserSchemaKey}-${spaceSchemaKey}-spaces`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'spaces'),
//   [`${cfUserSchemaKey}-${spaceSchemaKey}-managed_spaces`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'managed_spaces'),
//   [`${cfUserSchemaKey}-${spaceSchemaKey}-audited_spaces`]: (store, cfGuid, isAdmin) =>
//     createNonAdminFetchRole(store, cfGuid, isAdmin, 'audited_spaces'),
// };


// export function fetchEntityRelationAltAction(
//   store: Store<AppState>,
//   cfGuid: string,
//   isAdmin: boolean,
//   parent: EntityTreeRelation,
//   child: EntityTreeRelation): ValidateEntityResult {
//   return null;
//   // const key = `${parent.entityKey}-${child.entityKey}-${child.paramName}`;
//   // const func = alts[`${parent.entityKey}-${child.entityKey}-${child.paramName}`];
//   // return func ? func(store, cfGuid, isAdmin) : null;
// }
