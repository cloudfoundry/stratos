import { Injectable, Signal, computed, effect, inject, linkedSignal, signal, untracked } from '@angular/core';
import {
  ActionState,
  getDefaultActionState,
  UserProfileDataService,
  UserProfileInfo,
  UserProfileInfoEmail,
  UserProfileInfoUpdates } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthSignalService } from './signals/auth-signal.service';


@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private authSignals = inject(AuthSignalService);
  private userProfileData = inject(UserProfileDataService);


  private fetchStarted = false;
  // Counts the asks to fetch; the fetch itself waits for the user's guid.
  private readonly fetchRequests = signal(0);

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
    // Once there is a request and the session has a user, fetch their profile.
    const userGuid = computed(() => this.authSignals.sessionData()?.user?.guid);
    effect(() => {
      const requests = this.fetchRequests();
      const guid = userGuid();
      if (requests && guid) {
        untracked(() => this.userProfileData.fetch(guid));
      }
    });
  }

  /** Fetch the profile once, the first time any page asks for it. */
  loadUserProfile() {
    if (!this.fetchStarted) {
      this.fetchUserProfile();
    }
  }

  fetchUserProfile() {
    this.fetchStarted = true;
    this.fetchRequests.update(n => n + 1);
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
