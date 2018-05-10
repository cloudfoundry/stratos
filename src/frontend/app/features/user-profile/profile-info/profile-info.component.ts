import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { filter, map, first } from 'rxjs/operators';
import { SessionData } from '../../../store/types/auth.types';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { FetchUserProfileAction } from '../../../store/actions/user-profile.actions';
import { Observable } from 'rxjs/Observable';
import { UserProfileInfo } from '../../../store/types/user-profile.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { entityFactory, userProfileSchemaKey } from '../../../store/helpers/entity-factory';
import { UserProfileEffect } from '../../../store/effects/user-profile.effects';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit {

  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;

  constructor(private store: Store<AppState>, private entityMonitorFactory: EntityMonitorFactory) {

    const entityMonitor = this.entityMonitorFactory.create<UserProfileInfo>(UserProfileEffect.guid,
    userProfileSchemaKey, entityFactory(userProfileSchemaKey));

    this.userProfile$ = entityMonitor.entity$.pipe(
      filter(data => data && !!data.id)
    );

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => {
        const primaryEmails = profile.emails.filter((email => email.primary));
        const firstEmail = profile.emails.length ? profile.emails[0].value : 'No Email Address';
        return primaryEmails.length ? primaryEmails[0].value : firstEmail;
      })
    );

  }

  ngOnInit() {
    // Once we have the user's guid, fetch their profile
    this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData),
      first()
    ).subscribe(data => {
      this.store.dispatch(new FetchUserProfileAction(data.user.guid));
    });
  }

}
