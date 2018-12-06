import { CFAuthCheckerUser } from './checkers/users-assign-access';
import { CFAuthCheckerSpace } from './checkers/space-access';
import { CFAuthCheckerServiceInstance } from './checkers/service-instance-access';
import { CFAuthCheckerRoute } from './checkers/route-access';
import { CFAuthCheckerOrganization } from './checkers/organization-access';
import { CFAuthCheckerApplication } from './checkers/application-access';
import { SessionData } from '../../../store/types/auth.types';
import { CfAuthUserSummaryMapped, CFFeatureFlags, CFAuthResource, CFAuthAction, CFAuthChecker, CFFeatureFlagTypes } from './cf-auth.types';

export class CfAuthPrinciple {

  checkers: any[];

  isAdmin: boolean;
  isAdminReadOnly: boolean;
  isGlobalAuditor: boolean;


  constructor(
    private endpointGuid: string,
    private session: SessionData,
    public userSummary: CfAuthUserSummaryMapped,
    private featureFlags: CFFeatureFlags) {
    this.isAdmin = session.endpoints.cf[endpointGuid].user.admin;
    this.isAdminReadOnly = false; // WIP: RC Calculate according to scope
    this.isGlobalAuditor = false; // WIP: RC Calculate according to scope
  }

  /**
 * @name hasAccessTo
 * @description Does user have access to operation based on feature flags
 */
  hasAccessTo(operation: CFFeatureFlagTypes): boolean {
    return this.isAdmin || this.featureFlags[operation];
  }

  /**
 * @name isAllowed
 * @description Is user permitted to do the action.
 */
  isAllowed(resourceType: CFAuthResource, action: CFAuthAction): boolean {

    let args = Array.prototype.slice.call(arguments);
    if (args.length > 2) {
      // pass the rest of the arguments into accessChecker action
      args = args.splice(2);
    }

    const accessChecker = this.getAccessChecker(resourceType);
    return accessChecker[action].apply(accessChecker, args);
  }

  /**
* @name_createAccessCheckerList
* @description Internal method to create checker list
* @returns {Array}
*/
  private _createAccessCheckerList(): CFAuthChecker[] {

    const checkers = [];

    checkers.push(new CFAuthCheckerApplication(this));
    checkers.push(new CFAuthCheckerOrganization(this));
    checkers.push(new CFAuthCheckerRoute(this));
    checkers.push(new CFAuthCheckerServiceInstance(this));
    checkers.push(new CFAuthCheckerSpace(this));
    checkers.push(new CFAuthCheckerUser(this));
    return checkers;
  }

  /**
* @name _getAccessChecker
* @description Get Access checker for a given resource type
*/
  private getAccessChecker(resourceType: CFAuthResource): CFAuthChecker {

    if (!this.checkers || this.checkers.length === 0) {
      this.checkers = this._createAccessCheckerList();
    }

    return this.checkers.find((checker: any) => {
      return checker.canHandle(resourceType);
    });
  }

}
