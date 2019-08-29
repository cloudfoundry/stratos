import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../shared/monitors/entity-monitor.factory.service';
import { UserProfileInfo, UserProfileInfoEmail, UserProfileInfoUpdates } from '../../../../store/src/types/user-profile.types';
import { AppState } from '../../../../store/src/app-state';
import { UserProfileEffect, userProfilePasswordUpdatingKey } from '../../../../store/src/effects/user-profile.effects';
import { userProfileSchemaKey, entityFactory } from '../../../../store/src/helpers/entity-factory';
import { AuthState } from '../../../../store/src/reducers/auth.reducer';
import {
  FetchUserProfileAction,
  UpdateUserPasswordAction,
  UpdateUserProfileAction,
} from '../../../../store/src/actions/user-profile.actions';
import { ActionState, getDefaultActionState, rootUpdatingKey } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectUpdateInfo, selectRequestInfo } from '../../../../store/src/selectors/api.selectors';


@Injectable()
export class UserProfileService {

  isError$: Observable<boolean>;

  isFetching$: Observable<boolean>;

  entityMonitor: EntityMonitor<UserProfileInfo>;

  userProfile$: Observable<UserProfileInfo>;

  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    this.entityMonitor = this.entityMonitorFactory.create<UserProfileInfo>(UserProfileEffect.guid,
      userProfileSchemaKey, entityFactory(userProfileSchemaKey));

    this.userProfile$ = this.entityMonitor.entity$.pipe(
      filter(data => data && !!data.id)
    );
    this.isFetching$ = this.entityMonitor.isFetchingEntity$;

    this.isError$ = this.store.select(selectRequestInfo(userProfileSchemaKey, UserProfileEffect.guid)).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.fetching),
      map(requestInfo => requestInfo.error)
    );
  }

  fetchUserProfile() {
    // Once we have the user's guid, fetch their profile
    this.store.select(s => s.auth).pipe(
      filter((auth: AuthState) => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData),
      first()
    ).subscribe(data => {
      this.store.dispatch(new FetchUserProfileAction(data.user.guid));
    });
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
    const didChangeProfile = !!(profileChanges.givenName || profileChanges.familyName || profileChanges.emailAddress);
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
    updatedProfile.name.givenName = profileChanges.givenName || updatedProfile.name.givenName;
    updatedProfile.name.familyName = profileChanges.familyName || updatedProfile.name.familyName;
    if (profileChanges.emailAddress) {
      this.setPrimaryEmailAddress(updatedProfile, profileChanges.emailAddress);
    }
    this.store.dispatch(new UpdateUserProfileAction(updatedProfile, profileChanges.currentPassword));
    const actionState = selectUpdateInfo(userProfileSchemaKey,
      UserProfileEffect.guid,
      rootUpdatingKey);
    return this.store.select(actionState).pipe(
      filter(item => item && !item.busy)
    );
  }

  private updatePassword(profile: UserProfileInfo, profileChanges: UserProfileInfoUpdates): Observable<ActionState> {
    const passwordUpdates = {
      oldPassword: profileChanges.currentPassword,
      password: profileChanges.newPassword
    };
    this.store.dispatch(new UpdateUserPasswordAction(profile.id, passwordUpdates));
    const actionState = selectUpdateInfo(userProfileSchemaKey,
      UserProfileEffect.guid,
      userProfilePasswordUpdatingKey);
    return this.store.select(actionState).pipe(
      filter(item => item && !item.busy)
    );
  }
}
