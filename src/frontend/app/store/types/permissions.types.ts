import { ActionState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { IOrganization, ISpace } from '../../core/cf-api.types';

export enum PermissionRelationType {
  ORG = 'ORG_USER_PERMISSION_RELATION',
  SPACE = 'SPACE_USER_PERMISSION_RELATION'
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
  constructor(public data: APIResource[], public relationType: string, public type: PermissionRelationType) { }
}

export class OrganizationUserRelations {
  audited_organizations?: APIResource<IOrganization>[];
  billing_managed_organizations?: APIResource<IOrganization>[];
  managed_organizations?: APIResource<IOrganization>[];
  organizations?: APIResource<IOrganization>[];
}

export class SpaceUserRelations {
  audited_spaces?: APIResource<ISpace>[];
  managed_spaces?: APIResource<ISpace>[];
  spaces?: APIResource<ISpace>[];
}


export class UserPermissionRelations {
  organizations: OrganizationUserRelations;
  spaces: SpaceUserRelations;
}

export class EndpointRawPermissionData {
  constructor(public endpointId: string, public data: RawPermissionData[], public isAdmin = false) {
  }
}

export class EndpointRoleState {
  public endpointId: string;
  public isAdmin: boolean;
  public roles: EndpointRoles;
  constructor(rawData: EndpointRawPermissionData) {
    this.endpointId = rawData.endpointId;
    this.isAdmin = rawData.isAdmin;
    if (!this.isAdmin) {
      this.roles = this.generateEndpointRoles(rawData.data);
    }

  }

  private generateEndpointRoles(rawPermissions: RawPermissionData[]): EndpointRoles {
    const relationsSplitById = {
      organizations: {},
      spaces: {}
    };
    rawPermissions.forEach(permission => {
      let typeString = 'organizations';
      if (permission.type === PermissionRelationType.SPACE) {
        typeString = 'spaces';
      }
      permission.data.forEach(data => {
        const relationType = relationsSplitById[typeString];
        if (!relationType[data.metadata.guid]) {
          relationType[data.metadata.guid] = {};
        }
        if (!relationType[data.metadata.guid][permission.relationType]) {
          relationType[data.metadata.guid][permission.relationType] = [];
        }
        relationType[data.metadata.guid][permission.relationType].push(data);
      });
    });
    const roles = {
      organizations: {},
      spaces: {}
    }
    const spaceRoles = this.generateSpaceRoles(relationsSplitById.spaces);
  }

  private generateSpaceRoles(spaceRelations: SpaceUserRelations): SpaceRoles {

  }

  private generateOrganizationRoles(orgRelations: OrganizationUserRelations): OrganizationRoles {

  }

  private applyFeatureFlagPermissions(permissions: EndpointRoles) {
    return permissions;
  }
}

export class EntityPermission {
  create = false;
  update = false;
  delete = false;
  rename = false;
}

export class SpaceRoles {
  auditor = false;
  manager = false;
  developer = false;
}

export class OrganizationRoles {
  auditor = false;
  manager = false;
  billingManager = false;
  orgUser = true;
}

export class GlobalRoles {
  admin = false;
  readOnlyAdmin = false;
  auditor = false;
}

export interface EndpointRoles {
  space: {
    [guid: string]: SpaceRoles
  };
  organization: {
    [guid: string]: OrganizationRoles
  };
  global: GlobalRoles;
}

export interface PermissionState {
  internal: {
    isAdmin: boolean
  };
  cf: {
    [guid: string]: EndpointRoles
  };
}
