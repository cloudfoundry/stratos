import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of } from 'rxjs';

import { proxyAPIVersion } from '../jetstream';
import { ActionState, getDefaultActionState } from '../reducers/api-request-reducer/types';
import { UserProfileInfo, UserProfilePasswordUpdate } from '../types/user-profile.types';

/**
 * Signal-native owner of the current user's UAA profile, replacing the
 * `userProfile` ngrx entity stack (`user-profile.effects.ts` + the
 * `userProfile` entity registration / action builder). HTTP lifted verbatim
 * from the effect against `/pp/${proxyAPIVersion}/users/...`.
 *
 * There is only ever one profile (the connected user), so the source of truth
 * is a single `WritableSignal<UserProfileInfo | null>` — no entity keying.
 * `UserProfileService` (core) is the consumer facade and delegates here.
 *
 * The mutation methods return a one-shot `ActionState` (busy/error/message)
 * matching the legacy `.api.updateProfile/updatePassword` request-state shape,
 * so the facade's `filter(s => !s.busy)` pipelines keep working unchanged.
 * Like the legacy effect, a successful update does NOT refresh the profile
 * signal (the PUT returned empty entities) — callers re-fetch if needed.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileDataService {
  private http = inject(HttpClient);

  private readonly _profile = signal<UserProfileInfo | null>(null);
  private readonly _fetching = signal(false);
  private readonly _error = signal(false);

  readonly profile: Signal<UserProfileInfo | null> = this._profile.asReadonly();
  readonly fetching: Signal<boolean> = this._fetching.asReadonly();
  readonly error: Signal<boolean> = this._error.asReadonly();

  readonly profile$: Observable<UserProfileInfo | null> = toObservable(this._profile);
  readonly fetching$: Observable<boolean> = toObservable(this._fetching);
  readonly error$: Observable<boolean> = toObservable(this._error);

  /** Fetch the user's profile (legacy `FetchUserProfileAction`). Fire-and-forget. */
  fetch(userGuid: string): void {
    this._fetching.set(true);
    this._error.set(false);
    this.http.get<UserProfileInfo>(`/pp/${proxyAPIVersion}/users/${userGuid}`).subscribe({
      next: info => {
        this._profile.set(info);
        this._fetching.set(false);
      },
      error: () => {
        this._fetching.set(false);
        this._error.set(true);
      },
    });
  }

  /** Update the profile (legacy `UpdateUserProfileAction`). */
  updateProfile(profile: UserProfileInfo, currentPassword?: string): Observable<ActionState> {
    const headers: Record<string, string> = { 'If-Match': profile.meta.version.toString() };
    if (currentPassword) {
      headers['x-stratos-password'] = currentPassword;
    }
    return this.http.put(`/pp/${proxyAPIVersion}/users/${profile.id}`, profile, { headers }).pipe(
      map(() => getDefaultActionState()),
      catchError(() => of<ActionState>({ busy: false, error: true, message: 'Could not update User Profile Info' })),
    );
  }

  /** Update the user's password (legacy `UpdateUserPasswordAction`). */
  updatePassword(id: string, passwordChanges: UserProfilePasswordUpdate): Observable<ActionState> {
    const headers: Record<string, string> = {
      'x-stratos-password': passwordChanges.oldPassword,
      'x-stratos-password-new': passwordChanges.password,
    };
    return this.http.put(`/pp/${proxyAPIVersion}/users/${id}/password`, passwordChanges, { headers }).pipe(
      map(() => getDefaultActionState()),
      catchError(() => of<ActionState>({ busy: false, error: true, message: 'Could not update User Password' })),
    );
  }
}
