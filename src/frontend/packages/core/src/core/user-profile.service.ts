import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ActionState,
  getDefaultActionState,
  UserProfileDataService,
  UserProfileInfo,
  UserProfileInfoEmail,
  UserProfileInfoUpdates } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { AuthSignalService } from './signals/auth-signal.service';


@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private authSignals = inject(AuthSignalService);
  private userProfileData = inject(UserProfileDataService);


  isError$: Observable<boolean>;

  isFetching$: Observable<boolean>;

  userProfile$: Observable<UserProfileInfo>;

  private userGuid$: Observable<string>;

  constructor() {
    // Source the user GUID from the signal-native auth projection. The
    // upstream pipe order matches the legacy implementation: wait for
    // populated sessionData, then a populated `user`, then take the first
    // GUID and complete.
    this.userGuid$ = toObservable(this.authSignals.sessionData).pipe(
      filter(sessionData => !!sessionData?.user),
      take(1),
      map(data => data.user.guid)
    );

    // Read the profile off the signal-native UserProfileDataService (replaces
    // the ngrx `userProfile` EntityService). Same emission shape as before:
    // only emit a populated profile.
    this.userProfile$ = this.userProfileData.profile$.pipe(
      filter(data => data && !!data.id)
    );
    this.isFetching$ = this.userProfileData.fetching$;

    // Mirror the legacy behaviour: only report the error once the fetch has
    // settled (not while still fetching).
    this.isError$ = combineLatest([
      this.userProfileData.fetching$,
      this.userProfileData.error$
    ]).pipe(
      filter(([fetching]) => !fetching),
      map(([, error]) => error)
    );
  }

  fetchUserProfile() {
    // Once we have the user's guid, fetch their profile
    this.userGuid$.pipe(take(1)).subscribe(userGuid => {
      if (userGuid) { this.userProfileData.fetch(userGuid); }
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
      name: { ...profile.name } };
    if (profileChanges.givenName !== undefined) {
      updatedProfile.name.givenName = profileChanges.givenName;
    }
    if (profileChanges.familyName !== undefined) {
      updatedProfile.name.familyName = profileChanges.familyName;
    }
    if (profileChanges.emailAddress) {
      this.setPrimaryEmailAddress(updatedProfile, profileChanges.emailAddress);
    }

    return this.userProfileData.updateProfile(updatedProfile, profileChanges.currentPassword).pipe(
      filter(item => item && !item.busy)
    );
  }

  private updatePassword(profile: UserProfileInfo, profileChanges: UserProfileInfoUpdates): Observable<ActionState> {
    const passwordUpdates = {
      oldPassword: profileChanges.currentPassword,
      password: profileChanges.newPassword
    };
    return this.userProfileData.updatePassword(profile.id, passwordUpdates).pipe(
      filter(item => item && !item.busy)
    );
  }
}
