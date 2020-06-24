import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { AppState } from '../../../store/src/app-state';
import { EntityService } from '../../../store/src/entity-service';
import { ActionState, getDefaultActionState } from '../../../store/src/reducers/api-request-reducer/types';
import { AuthState } from '../../../store/src/reducers/auth.reducer';
import { stratosEntityCatalog } from '../../../store/src/stratos-entity-catalog';
import { SessionData } from '../../../store/src/types/auth.types';
import { UserProfileInfo, UserProfileInfoEmail, UserProfileInfoUpdates } from '../../../store/src/types/user-profile.types';


@Injectable()
export class UserProfileService {

  isError$: Observable<boolean>;

  isFetching$: Observable<boolean>;

  entityService: Observable<EntityService<UserProfileInfo>>;

  userProfile$: Observable<UserProfileInfo>;

  private userGuid$: Observable<string>;

  constructor(
    private store: Store<AppState>,
  ) {
    this.userGuid$ = this.store.select(s => s.auth).pipe(
      filter((auth: AuthState) => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData),
      filter((sessionData: SessionData) => !!sessionData.user),
      first(),
      map(data => data.user.guid)
    );

    this.entityService = this.userGuid$.pipe(
      first(),
      map(userGuid => stratosEntityCatalog.userProfile.store.getEntityService(userGuid)),
      publishReplay(1),
      refCount()
    );

    this.userProfile$ = this.entityService.pipe(
      switchMap(service => service.waitForEntity$),
      map(({ entity }) => entity),
      filter(data => data && !!data.id)
    );
    this.isFetching$ = this.entityService.pipe(
      switchMap(service => service.isFetchingEntity$)
    );

    this.isError$ = this.entityService.pipe(
      switchMap(es => es.entityMonitor.entityRequest$),
      filter(requestInfo => !!requestInfo && !requestInfo.fetching),
      map(requestInfo => requestInfo.error)
    )
  }

  fetchUserProfile() {
    // Once we have the user's guid, fetch their profile
    this.userGuid$.pipe(first()).subscribe(userGuid => stratosEntityCatalog.userProfile.api.get(userGuid));
  }

  getPrimaryEmailAddress(profile: UserProfileInfo): string {
    const primaryEmails = profile.emails.filter((email => email.primary));
    const firstEmail = profile.emails.length ? profile.emails[0].value : 'No Email Address';
    return primaryEmails.length ? primaryEmails[0].value : firstEmail;
  }

  setPrimaryEmailAddress(profile: UserProfileInfo, newEmailAddress: string) {
    const newEmails: UserProfileInfoEmail[] = [];
    const currentPrimaryEmail = this.getPrimaryEmailAddress(profile);
    profile.emails.forEach(email => {
      if (email.value === currentPrimaryEmail) {
        newEmails.push({
          primary: email.primary,
          value: newEmailAddress
        });
      } else {
        newEmails.push(email);
      }
    });
    profile.emails = newEmails;
  }

  /*
  * Update profile
  */
  updateProfile(profile: UserProfileInfo, profileChanges: UserProfileInfoUpdates): Observable<[ActionState, ActionState]> {
    const didChangeProfile = (profileChanges.givenName !== undefined ||
      profileChanges.familyName !== undefined ||
      profileChanges.emailAddress !== undefined);
    const didChangePassword = !!(profileChanges.newPassword && profileChanges.currentPassword);
    const profileObs$ = didChangeProfile ? this.updateProfileInfo(profile, profileChanges) : observableOf(getDefaultActionState());
    const passwordObs$ = didChangePassword ? this.updatePassword(profile, profileChanges) : observableOf(getDefaultActionState());
    return combineLatest(
      profileObs$,
      passwordObs$
    );
  }

  private updateProfileInfo(profile: UserProfileInfo, profileChanges: UserProfileInfoUpdates): Observable<ActionState> {
    const updatedProfile = {
      ...profile,
      name: { ...profile.name },
    };
    if (profileChanges.givenName !== undefined) {
      updatedProfile.name.givenName = profileChanges.givenName;
    }
    if (profileChanges.familyName !== undefined) {
      updatedProfile.name.familyName = profileChanges.familyName;
    }
    if (profileChanges.emailAddress) {
      this.setPrimaryEmailAddress(updatedProfile, profileChanges.emailAddress);
    }

    return stratosEntityCatalog.userProfile.api.updateProfile<ActionState>(updatedProfile, profileChanges.currentPassword).pipe(
      filter(item => item && !item.busy)
    );
  }

  private updatePassword(profile: UserProfileInfo, profileChanges: UserProfileInfoUpdates): Observable<ActionState> {
    const passwordUpdates = {
      oldPassword: profileChanges.currentPassword,
      password: profileChanges.newPassword
    };
    return stratosEntityCatalog.userProfile.api.updatePassword<ActionState>(profile.id, passwordUpdates).pipe(
      filter(item => item && !item.busy)
    );
  }
}
