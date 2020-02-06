import { CFAuthChecker, CFAuthResource } from '../cf-auth.types';
import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';

export class CFAuthCheckerApplication extends CfAuthBaseAccess implements CFAuthChecker {

  /**
   *
   */
  constructor(private principal: CfAuthPrinciple) {
    super(principal);

  }

  /**
   * User can deploy apps if:
   * 1. User is an admin
   * 2. User is a space developer
   * @param  spaceGuid GUID of the space where the application resides
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
   * User can manage apps if:
   * 1. User is an admin
   * 2. User is a space developer
   * @param spaceGuid GUID of the space where the application resides
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
   * User can delete apps if:
   * 1. User is an admin
   * 2. User is a space developer
   * @param spaceGuid GUID of the space where the application resides
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
   * Specifies that this ACL checker can handle `application` permission
   * @param resource - String representing the resource
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.application;
  }
}
