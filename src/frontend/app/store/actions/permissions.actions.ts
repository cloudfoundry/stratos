import { PaginatedAction } from '../types/pagination.types';
import { RequestOptions } from '@angular/http';
import { organizationSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { CFStartAction } from '../types/request.types';
import { Action } from '@ngrx/store';

export const GET_AUDITED_ORG_PERMISSION = '[Users] Get audited org Permission';
export const GET_AUDITED_ORG_PERMISSION_SUCCESS = '[Users] Get audited org Permission success';
export const GET_AUDITED_ORG_PERMISSION_FAILED = '[Users] Get audited org Permission failed';

export const GET_BILLING_MANAGED_ORG_PERMISSION = '[Users] Get BILLING_MANAGED org Permission';
export const GET_BILLING_MANAGED_ORG_PERMISSION_SUCCESS = '[Users] Get BILLING_MANAGED org Permission success';
export const GET_BILLING_MANAGED_ORG_PERMISSION_FAILED = '[Users] Get BILLING_MANAGED org Permission failed';

export const GET_MANAGED_ORG_PERMISSION = '[Users] Get MANAGED org Permission';
export const GET_MANAGED_ORG_PERMISSION_SUCCESS = '[Users] Get MANAGED org Permission success';
export const GET_MANAGED_ORG_PERMISSION_FAILED = '[Users] Get MANAGED org Permission failed';

export const GET_ORG_PERMISSION = '[Users] Get org Permission';
export const GET_ORG_PERMISSION_SUCCESS = '[Users] Get org Permission success';
export const GET_ORG_PERMISSION_FAILED = '[Users] Get org Permission failed';

export const GET_AUDITED_SPACE_PERMISSION = '[Users] Get AUDITED_SPACE Permission';
export const GET_AUDITED_SPACE_PERMISSION_SUCCESS = '[Users] Get AUDITED_SPACE Permission success';
export const GET_AUDITED_SPACE_PERMISSION_FAILED = '[Users] Get AUDITED_SPACE Permission failed';

export const GET_MANAGED_SPACE_PERMISSION = '[Users] Get MANAGED_SPACE Permission';
export const GET_MANAGED_SPACE_PERMISSION_SUCCESS = '[Users] Get MANAGED_SPACE Permission success';
export const GET_MANAGED_SPACE_PERMISSION_FAILED = '[Users] Get MANAGED_SPACE Permission failed';

export const GET_SPACE_PERMISSION = '[Users] Get SPACE Permission';
export const GET_SPACE_PERMISSION_SUCCESS = '[Users] Get SPACE Permission success';
export const GET_SPACE_PERMISSION_FAILED = '[Users] Get SPACE Permission failed';

export const GET_CURRENT_USER_PERMISSIONS = '[Permissions] Get current user';
export class GetCurrentUsersPermissions implements Action {
  type = GET_CURRENT_USER_PERMISSIONS;
}
// class GetUserPermission extends CFStartAction implements PaginatedAction {
//   actions: string[];
//   entityKey: string;
//   paginationKey: string;
//   options: RequestOptions;
//   constructor(public guid: string, type: string) {
//     super();
//     const typeOptions = this.types[type];
//     this.options = new RequestOptions();
//     this.options.url = `users/${guid}/${type}`;
//     this.options.method = 'get';

//     this.actions = typeOptions.actions;
//     this.entityKey = typeOptions.entityKey;
//     this.paginationKey = this.getPaginationKey(type);
//   }
//   private types = {
//     'audited_organization': {
//       actions: [GET_AUDITED_ORG_PERMISSION, GET_AUDITED_ORG_PERMISSION_SUCCESS, GET_AUDITED_ORG_PERMISSION_FAILED],
//       entityKey: organizationSchemaKey
//     },
//     'billing_managed_organizations': {
//       actions: [GET_BILLING_MANAGED_ORG_PERMISSION, GET_BILLING_MANAGED_ORG_PERMISSION_SUCCESS, GET_BILLING_MANAGED_ORG_PERMISSION_FAILED],
//       entityKey: organizationSchemaKey
//     },
//     'managed_organizations': {
//       actions: [GET_MANAGED_ORG_PERMISSION, GET_MANAGED_ORG_PERMISSION_SUCCESS, GET_MANAGED_ORG_PERMISSION_FAILED],
//       entityKey: organizationSchemaKey
//     },
//     'organizations': {
//       actions: [GET_ORG_PERMISSION, GET_ORG_PERMISSION_SUCCESS, GET_ORG_PERMISSION_FAILED],
//       entityKey: organizationSchemaKey
//     },
//     'audited_spaces': {
//       actions: [GET_AUDITED_SPACE_PERMISSION, GET_AUDITED_SPACE_PERMISSION_SUCCESS, GET_AUDITED_SPACE_PERMISSION_FAILED],
//       entityKey: spaceSchemaKey
//     },
//     'managed_spaces': {
//       actions: [GET_MANAGED_SPACE_PERMISSION, GET_MANAGED_SPACE_PERMISSION_SUCCESS, GET_MANAGED_SPACE_PERMISSION_FAILED],
//       entityKey: spaceSchemaKey
//     },
//     'spaces': {
//       actions: [GET_SPACE_PERMISSION, GET_SPACE_PERMISSION_SUCCESS, GET_SPACE_PERMISSION_SUCCESS],
//       entityKey: spaceSchemaKey
//     }
//   };
//   public getPaginationKey(type: string) {
//     return `current-user-permissions-${type}`;
//   }
// }

// export class GetUsersAuditedOrganizations extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'audited_organization');
//   }
// }

// export class GetUsersBillingOrganizations extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'billing_managed_organizations');
//   }
// }

// export class GetUsersManagedOrganizations extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'managed_organizations');
//   }
// }

// export class GetUsersOrganizations extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'organizations');
//   }
// }

// export class GetUsersAuditedSpaces extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'audited_spaces');
//   }
// }

// export class GetUsersManagedSpaces extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'managed_spaces');
//   }
// }

// export class GetUsersSpaces extends GetUserPermission {
//   constructor(public guid: string) {
//     super(guid, 'spaces');
//   }
// }

