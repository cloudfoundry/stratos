import { SessionData } from '../../../store/types/auth.types';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../../../store/types/cnsis.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { AuthUser, selectSessionData } from '../../../store/reducers/auth.reducer';
import { CfAuthPrinciple } from './principal';
import { CFAuthAction, CFAuthResource, CfAuthUserSummary, CfAuthUserSummaryMapped, CFFeatureFlags } from './cf-auth.types';
import { cnsisEntitiesSelector } from '../../../store/selectors/cnsis.selectors';
import { APIEntities } from '../../../store/types/api.types';

/**
 * NOTE - WIP
 * This is the port of basic cf auth from v1. It's missing a number of things
 * - Fetch the correct data, store in the store and fetch from store
 * - Handling fetch wait and error
 * - Calculate read-only admin and group auditor values from user scope and intergrate with principals (new, not in V1)
 * - Determine org or space 'suspended' state and intergrate with principals
*/

@Injectable()
export class CfAuthService {


  endpoints$: Observable<APIEntities<CNSISModel>>;
  sessionData$: Observable<SessionData>;
  // WIP: RC Initialise previously released promise when all init requests finished. For the time being use this, then make selector
  initialised$: Observable<boolean>;
  // WIP: RC This should come from the store and populated using standard entity/non entity methods
  featureFlags$: {
    [key: string]: Observable<CFFeatureFlags>
  };
  // WIP: RC This should be in the store
  principals: {
    [key: string]: CfAuthPrinciple;
  };
  // WIP: RC This should come from the store and populated using standard entity/non entity methods
  userSummaries$: {
    [cnsiGuid: string]: {
      [userGuid: string]: Observable<CfAuthUserSummary>;
    };
  };


  // WIP: Async/Sync calls. Need to review once store stuff done
  session: SessionData;

  constructor(private store: Store<AppState>) {
    this.endpoints$ = store.select(cnsisEntitiesSelector);
    this.sessionData$ = store.select<SessionData>(selectSessionData());
  }

  initialise() {
    Observable.combineLatest(
      this.endpoints$.take(1),
      this.sessionData$,
    ).subscribe(([cnsis, session]: [APIEntities<CNSISModel>, SessionData]) => {
      this.session = session;
      Object.keys(cnsis).forEach(cnsiGuid => {
        const cnsi = cnsis[cnsiGuid];
        if (cnsi.registered) {
          // User hasn't connected to this endpoint
          return;
        } else if (this.isInitialized(cnsi.guid)) {
          // We have already initialised for this endpoint + user
          return;
        }
        this.initializeForEndpoint(cnsi.guid, session);
      });
    });
  }

  /**
   * @name isAllowed
   * @description is user allowed the certain action
   */
  isAllowed(cnsiGuid: string, resourceType: CFAuthResource, action: CFAuthAction, ...args: any[]): boolean {
    if (!this.isInitialized(cnsiGuid)) {
      return false;
    }
    return this.principals[cnsiGuid].isAllowed.apply(this.principals[cnsiGuid], args);
  }

  remove(cnsiGuid) {
    delete this.principals[cnsiGuid];
  }

  /**
   * @name isOrgOrSpaceActionableByResource
   * @description convenience method to determine if the user has rights to execute the action against the resource
   * in the organization or any of the organization's spaces
  */
  isOrgOrSpaceActionableByResource(cnsiGuid: string, orgGuid: string, spaceGuids: string[], action: CFAuthAction): boolean {
    // Is the organization valid?
    if (this.isAllowed(cnsiGuid, CFAuthResource.organization, action, orgGuid)) {
      return true;
    } else {
      // Is any of the organization's spaces valid?
      for (const spaceGuid in spaceGuids) {
        if (this.isAllowed(cnsiGuid, CFAuthResource.space, action, spaceGuid, orgGuid)) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * @name isAdmin
   * @description Is User Admin in endpoint
   */
  isAdmin(cnsiGuid: string): boolean {
    if (!this.isInitialized(cnsiGuid)) {
      return false;
    }
    return this.principals[cnsiGuid].isAdmin;
  }

  private isInitialized(cnsiGuid: string): boolean {
    let initialised = !!this.principals[cnsiGuid];

    if (this.session.user && initialised) {
      initialised = this.session.endpoints.cf[cnsiGuid].user.guid === this.session.user.guid;
    }
    return !!initialised;
  }

  private initializeForEndpoint(cnsiGuid: string, sessionData: SessionData) {
    this.principals[cnsiGuid] = null;
    const cfUserGuid = sessionData.endpoints.cf[cnsiGuid].user.guid;
    const isAdmin = sessionData.endpoints.cf[cnsiGuid].user.admin;

    if (isAdmin) {
      // WIP: RC Fetch user role data using the user summary endpoint
      // User is an admin, therefore, we will use the more efficient userSummary request
    } else {
      // WIP: RC Fetch user role data using seperate org/space requests
      // promises = promises.concat(_addOrganisationRolePromisesForUser(cnsiGuid, userId));
      // promises = promises.concat(_addSpaceRolePromisesForUser(cnsiGuid, userId));
    }

    Observable.combineLatest(
      this.sessionData$,
      this.featureFlags$[cnsiGuid],
      this.userSummaries$[cnsiGuid][cfUserGuid],
    ).take(1).subscribe(([session, featureFlags, userSummary]: [SessionData, CFFeatureFlags, CfAuthUserSummary]) => {
      const mappedSummary: CfAuthUserSummaryMapped = {
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
      };
      this.principals[cnsiGuid] = new CfAuthPrinciple(cfUserGuid, session, mappedSummary, featureFlags);
    });
  }

}
