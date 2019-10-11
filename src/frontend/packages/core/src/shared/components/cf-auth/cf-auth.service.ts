import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { selectSessionData } from '../../../../../store/src/reducers/auth.reducer';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { SessionData } from '../../../../../store/src/types/auth.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { CFAuthAction, CFAuthResource, CfAuthUserSummary, CfAuthUserSummaryMapped, CFFeatureFlags } from './cf-auth.types';
import { CfAuthPrinciple } from './principal';


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
  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
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
    [endpointGuid: string]: {
      [userGuid: string]: Observable<CfAuthUserSummary>;
    };
  };


  // WIP: Async/Sync calls. Need to review once store stuff done
  session: SessionData;

  constructor(private store: Store<CFAppState>) {
    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.sessionData$ = store.select<SessionData>(selectSessionData());
  }

  initialise() {
    observableCombineLatest(
      this.endpoints$.pipe(take(1)),
      this.sessionData$,
    ).subscribe(([endpoints, session]: [IRequestEntityTypeState<EndpointModel>, SessionData]) => {
      this.session = session;
      Object.values(endpoints).forEach(endpoint => {
        if (endpoint.registered) {
          // User hasn't connected to this endpoint
          return;
        } else if (this.isInitialized(endpoint.guid)) {
          // We have already initialised for this endpoint + user
          return;
        }
        this.initializeForEndpoint(endpoint.guid, session);
      });
    });
  }

  /**
   * is user allowed the certain action
   */
  isAllowed(endpointGuid: string, resourceType: CFAuthResource, action: CFAuthAction, ...args: any[]): boolean {
    if (!this.isInitialized(endpointGuid)) {
      return false;
    }
    return this.principals[endpointGuid].isAllowed.apply(this.principals[endpointGuid], args);
  }

  remove(endpointGuid) {
    delete this.principals[endpointGuid];
  }

  /**
   * convenience method to determine if the user has rights to execute the action against the resource
   * in the organization or any of the organization's spaces
   */
  isOrgOrSpaceActionableByResource(endpointGuid: string, orgGuid: string, spaceGuids: string[], action: CFAuthAction): boolean {
    // Is the organization valid?
    if (this.isAllowed(endpointGuid, CFAuthResource.organization, action, orgGuid)) {
      return true;
    } else {
      // Is any of the organization's spaces valid?
      for (const spaceGuid in spaceGuids) {
        if (this.isAllowed(endpointGuid, CFAuthResource.space, action, spaceGuid, orgGuid)) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Is User Admin in endpoint
   */
  isAdmin(endpointGuid: string): boolean {
    if (!this.isInitialized(endpointGuid)) {
      return false;
    }
    return this.principals[endpointGuid].isAdmin;
  }

  private isInitialized(endpointGuid: string): boolean {
    let initialised = !!this.principals[endpointGuid];

    if (this.session.user && initialised) {
      initialised = this.session.endpoints.cf[endpointGuid].user.guid === this.session.user.guid;
    }
    return !!initialised;
  }

  private initializeForEndpoint(endpointGuid: string, sessionData: SessionData) {
    this.principals[endpointGuid] = null;
    const cfUserGuid = sessionData.endpoints.cf[endpointGuid].user.guid;
    const isAdmin = sessionData.endpoints.cf[endpointGuid].user.admin;

    if (isAdmin) {
      // WIP: RC Fetch user role data using the user summary endpoint
      // User is an admin, therefore, we will use the more efficient userSummary request
    } else {
      // WIP: RC Fetch user role data using seperate org/space requests
      // promises = promises.concat(_addOrganisationRolePromisesForUser(endpointGuid, userId));
      // promises = promises.concat(_addSpaceRolePromisesForUser(endpointGuid, userId));
    }

    observableCombineLatest(
      this.sessionData$,
      this.featureFlags$[endpointGuid],
      this.userSummaries$[endpointGuid][cfUserGuid],
    ).pipe(take(1)).subscribe(([session, featureFlags, userSummary]: [SessionData, CFFeatureFlags, CfAuthUserSummary]) => {
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
      this.principals[endpointGuid] = new CfAuthPrinciple(cfUserGuid, session, mappedSummary, featureFlags);
    });
  }

}
