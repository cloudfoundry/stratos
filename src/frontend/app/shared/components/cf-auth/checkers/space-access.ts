import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';
import { CFAuthResource, CFAuthChecker } from '../cf-auth.types';
export class CFAuthCheckerSpace extends CfAuthBaseAccess implements CFAuthChecker {

  constructor(private principal: CfAuthPrinciple) {
    super(principal);
  }

  /**
    * @name create
    * @description User can create a space if:
    * 1. User is an Admin
    * 2. User is an Org Manager
    */
  create(spaceGuid: string): boolean {
    if (super.baseCreate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.organizations.managed, spaceGuid);
  }

  /**
   * @name update
   * @description User can update a space if:
   * 1. User is an admin
   * 2. User is org manager
   * 3. user is space manager
   */
  update(spaceGuid: string, orgGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid) ||
      super.doesContainGuid(this.principal.userSummary.spaces.managed, spaceGuid);
  }

  /**
   * @name delete
   * @description User can delete space if:
   * 1. user is an admin
   * 2. user is the org manager
   */
  delete(orgGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
  }

  /**
   * @name canHandle
   * @description Specifies that this ACL checker can handle `application` permission
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.space;
  }
}
