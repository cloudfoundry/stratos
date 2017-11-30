import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';
import { CFAuthResource, CFAuthChecker, CFFeatureFlagTypes } from '../cf-auth.types';
export class CFAuthCheckerRoute extends CfAuthBaseAccess implements CFAuthChecker {

  /**
   *
   */
  constructor(private principal: CfAuthPrinciple) {
    super(principal);

  }

  /**
    * @name create
    * @description User can create a route if:
    * 1. User is admin
    * 2. User is a space developer AND route_creation feature flag is turned on
    */
  create(spaceGuid: string): boolean {

    // Admin
    if (super.baseCreate()) {
      return true;
    }

    // If user is developer in space app belongs to
    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid) &&
      this.principal.hasAccessTo(CFFeatureFlagTypes.route_creation);
  }

  /**
   * @name update
   * @description User can manage apps if:
   * 1. User is an admin
   * 2. User is a space developer
   */
  update(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * @name delete
   * @description User can delete apps if:
   * 1. User is an admin
   * 2. User is a space developer
   */
  delete(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * @name canHandle
   * @description Specifies that this ACL checker can handle `application` permission
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.route;
  }
}
