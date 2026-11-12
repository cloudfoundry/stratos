import { Injectable, Signal, computed, inject, linkedSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ActionState,
  getDefaultActionState,
  SessionData,
  SessionUser,
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


  private userGuid$: Observable<string>;

  private fetchStarted = false;

  /**
   * The user's profile, null until it has loaded. Reading it does not fetch:
   * call loadUserProfile() where the profile is shown.
   */
  readonly userProfile: Signal<UserProfileInfo | null> = computed(() => {
    const profile = this.userProfileData.profile();
    return profile && profile.id ? profile : null;
  });

  /**
   * Whether the last fetch failed. While a fetch runs it keeps the previous
   * answer, as the error is only known once the fetch has settled.
   */
  readonly isError: Signal<boolean> = linkedSignal<{ fetching: boolean; error: boolean; }, boolean>({
    source: () => ({ fetching: this.userProfileData.fetching(), error: this.userProfileData.error() }),
    computation: ({ fetching, error }, previous) => fetching ? (previous?.value ?? false) : error,
  });

  constructor() {
    // Source the user GUID from the signal-native auth projection. The
    // upstream pipe order matches the legacy implementation: wait for
    // populated sessionData, then a populated `user`, then take the first
    // GUID and complete.
    this.userGuid$ = toObservable(this.authSignals.sessionData).pipe(
      filter((sessionData): sessionData is SessionData & { user: SessionUser } => !!sessionData?.user),
      take(1),
      map(data => data.user.guid)
    );
  }

  /** Fetch the profile once, the first time any page asks for it. */
  loadUserProfile() {
    if (!this.fetchStarted) {
      this.fetchUserProfile();
    }
  }

  fetchUserProfile() {
    this.fetchStarted = true;
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
    return combineLatest([
      profileObs$,
      passwordObs$
    ]);
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
    const { currentPassword, newPassword } = profileChanges;
    if (currentPassword === undefined || newPassword === undefined) {
      // updateProfile only routes here when both passwords are present
      // (didChangePassword); guard so the typed payload is honest.
      return observableOf<ActionState>({ busy: false, error: true, message: 'Missing password change details' });
    }
    const passwordUpdates = {
      oldPassword: currentPassword,
      password: newPassword
    };
    return this.userProfileData.updatePassword(profile.id, passwordUpdates).pipe(
      filter(item => item && !item.busy)
    );
  }
}
