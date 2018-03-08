import { APIResource } from './api.types';
import { schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';

export interface CfUser {
  organizations: APIResource<any>[];
  managed_organizations: APIResource<any>[];
  billing_managed_organizations: APIResource<any>[];
  audited_organizations: APIResource<any>[];

  spaces: APIResource<any>[];
  managed_spaces: APIResource<any>;
  audited_spaces: APIResource<any>;
  cfGuid?: string;
  guid: string;
  username: string;
}

export interface UserRoleInOrg {
  orgManager: boolean;
  billingManager: boolean;
  auditor: boolean;
  user: boolean;
}
export interface IUserPermissionInOrg {
  orgName: string;
  orgGuid: string;
  permissions: {
    orgManager: boolean,
    billingManager: boolean,
    auditor: boolean,
    user: boolean
  };
}

export interface UserRoleInSpace {
  manager: boolean;
  developer: boolean;
  auditor: boolean;
}
