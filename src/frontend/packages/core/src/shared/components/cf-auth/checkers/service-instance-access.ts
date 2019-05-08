import { CFAuthChecker, CFAuthResource, CFFeatureFlagTypes } from '../cf-auth.types';
import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';

export class CFAuthCheckerServiceInstance extends CfAuthBaseAccess implements CFAuthChecker {

  constructor(private principal: CfAuthPrinciple) {
    super(principal);
  }

  /**
   * A User is can create a service if:
   * 1. User is an admin
   * 2. Is a space developer and the feature flag is enabled
   */
  create(spaceGuid: string): boolean {

    // If user is developer in space the service instances will
    // belong to and the service_instance_creation flag is set
    // Admin
    if (super.baseCreate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid) &&
      this.principal.hasAccessTo(CFFeatureFlagTypes.service_instance_creation);
  }

  /**
   * User can update a service instance if:
   * 1. User is an admin
   * 2. or a space developer
   */
  update(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * User can delete a service instance if:
   * 1. They are an admin
   * 2. or they are a space developer
   */
  delete(spaceGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    return super.doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
  }

  /**
   * Specifies that this ACL checker can handle `application` permission
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.managed_service_instance;
  }
}
