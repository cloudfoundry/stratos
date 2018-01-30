import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';
import { CFAuthResource, CFAuthChecker } from '../cf-auth.types';
export class CFAuthCheckerApplication extends CfAuthBaseAccess implements CFAuthChecker {

  /**
   *
   */
  constructor(private principal: CfAuthPrinciple) {
    super(principal);

  }

  /**
    * @name create
    * @description User can deploy apps if:
    * 1. User is an admin
    * 2. User is a space developer
    * @param {string} spaceGuid GUID of the space where the application resides
    */
  create(spaceGuid: string): boolean {

    // Admin
    if (super.baseCreate()) {
      return true;
    }

    // If user is developer in space app belongs to
    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * @name update
   * @description User can manage apps if:
   * 1. User is an admin
   * 2. User is a space developer
   * @param {string} spaceGuid GUID of the space where the application resides
   */
  update(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    // If user is developer in space app belongs to
    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * @name delete
   * @description User can delete apps if:
   * 1. User is an admin
   * 2. User is a space developer
   * @param {string} spaceGuid GUID of the space where the application resides
   */
  delete(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    // If user is developer in space app belongs to
    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * @name canHandle
   * @description Specifies that this ACL checker can handle `application` permission
   * @param {String} resource - String representing the resource
   * @returns {boolean}
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.application;
  }
}
