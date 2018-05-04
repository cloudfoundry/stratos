import { ActionState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';

export enum PermissionRelationType {
  ORG = 'org',
  SPACE = 'space'
}
export const userOrgRelationsTypes = [
  'audited_organizations',
  'billing_managed_organizations',
  'managed_organizations',
  'organizations',
];

export const userSpaceRelationsTypes = [
  'audited_spaces',
  'managed_spaces',
  'spaces'
];

export class RawPermissionData {
  constructor(public data: APIResource[], public relationType: string, public type: 'org' | 'space') { }
}

export class OrgSummary() {

}

export class EndpointRawPermissionData {
  constructor(public endpointId: string, public data: RawPermissionData[], public isAdmin = false) { }
  organizations: {
    audited: userSummary.audited_organizations,
    billingManaged: userSummary.billing_managed_organizations,
    managed: userSummary.managed_organizations,
    // User is a user in all these orgs
    all: userSummary.organizations
  },
  spaces: {
    audited: userSummary.audited_spaces,
    managed: userSummary.managed_spaces,
    // User is a developer in this spaces
    all: userSummary.spaces
  }
}

class EndpointPermissionState {
  public endpointId: string;
  public isAdmin: boolean;
  public permissions: EndpointPermissions;
  constructor(rawData: EndpointRawPermissionData) {
    this.endpointId = rawData.endpointId;
    this.isAdmin = rawData.isAdmin;
    if (!this.isAdmin) {
      this.permissions = this.generateEndpointPermissions(rawData.data);
    }

  }

  private generateEndpointPermissions(rawPermissions: RawPermissionData[]) {
    rawPermissions.
      rawPermissions.forEach()
  }

  private applyFeatureFlagPermissions(permissions: EndpointPermissions) {
    return permissions;
  }
}

export class EntityPermission {
  create = false;
  update = false;
  delete = false;
  rename = false;
}

export interface EndpointPermissions {
  space: EntityPermission;
  user: EntityPermission;
  space_quota_definition: EntityPermission;
  user_provided_service_instance: EntityPermission;
  managed_service_instance: EntityPermission;
  service_instance: EntityPermission;
  organization: EntityPermission;
  application: EntityPermission;
  domain: EntityPermission;
  route: EntityPermission;
}

export interface PermissionState {
  internal: {
    isAdmin: boolean
  };
  cf: {
    [guid: string]: {
      isAdmin: boolean,
      isReadOnlyAdmin: boolean,
      isGlobalAuditor: boolean,
      permissions: EndpointPermissions
    }
  };
}
