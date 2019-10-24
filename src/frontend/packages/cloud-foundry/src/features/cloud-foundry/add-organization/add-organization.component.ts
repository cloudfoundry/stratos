import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, first, map, mergeMap } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../store/src/app-state';
import { AuthState } from '../../../../../store/src/reducers/auth.reducer';
import { UsersRolesSetUsers } from '../../../actions/users-roles.actions';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { AddOrganizationService } from './add-organization.service';

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  styleUrls: ['./add-organization.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    AddOrganizationService
  ]
})
export class AddOrganizationComponent {
  cfUrl: string;
  submit: StepOnNextFunction;

  constructor(
    store: Store<AppState>,
    cfUserService: CfUserService,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    addOrgService: AddOrganizationService
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;

    // Ensure that when we arrive here directly the store is set up with all it needs
    store.select(s => s.auth).pipe(
      filter((auth: AuthState) => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData),
      mergeMap(sessionData => cfUserService.getUser(cfId, sessionData.user.guid)), // TODO: RC
      first()
    ).subscribe(data => {
      store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, [data.user]));
    });
    // TODO: RC Split out -----------------------

    this.submit = () => {
      return combineLatest([
        addOrgService.createOrg()
      ]).pipe(
        map(res => res[0])
        // TODO: RC
        // map((results: StepOnNextResult[]) => results.some(res => !res.success))
      );
    };
  }
}

