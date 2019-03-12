import { CFAuthChecker, CFAuthResource, CFFeatureFlagTypes } from '../cf-auth.types';
import { CfAuthPrinciple } from '../principal';
import { CfAuthBaseAccess } from './base-access';

export class CFAuthCheckerOrganization extends CfAuthBaseAccess implements CFAuthChecker {

  /**
   *
   */
  constructor(private principal: CfAuthPrinciple) {
    super(principal);
  }

  /**
   * Users can create an organization if:
   * 1. User is and admin
   * 2. the `user_org_creation` feature flag is enabled
   */
  create(orgGuid: string): boolean {

    // Admin
    if (super.baseCreate()) {
      return true;
    }

    // If user is developer in space app belongs to
    return this.principal.hasAccessTo(CFFeatureFlagTypes.user_org_creation);
  }

  /**
   * Users can update an organization if:
   * 1. User is and admin
   * 2. is Org Manager
   */
  update(orgGuid: string): boolean {
    // Admin
    if (super.baseUpdate()) {
      return true;
    }

    // If user is manager of org
    return super.doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
  }

  /**
   * @description Users can delete an organization if:
   * 1. User is and admin
   * 2. is Org Manager
   */
  delete(orgGuid: string): boolean {
    // Admin
    if (super.baseDelete()) {
      return true;
    }

    // If user is manager of org
    return super.doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
  }

  /**
   * Specifies that this ACL checker can handle `application` permission
   * @param resource - String representing the resource
   */
  canHandle(resource: CFAuthResource): boolean {
    return resource === CFAuthResource.organization;
  }
}
