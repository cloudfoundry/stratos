import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@stratosui/store';
import { combineLatest as obsCombineLatest, Observable, Subscription } from 'rxjs';
import { take, combineLatest, filter, map, startWith } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import {
  SignalStepHandle,
  StepComponent,
} from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { AppState } from '../../../../../../store/src/app-state';
import {
  UsersRolesClear,
  UsersRolesExecuteChanges,
  UsersRolesSetChanges,
  UsersRolesSetUsers } from '../../../../actions/users-roles.actions';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { selectCfUsersRoles } from '../../../../store/selectors/cf-users-roles.selector';
import { CfUser, IUserPermissionInOrg, IUserPermissionInSpace, OrgUserRoleNames, SpaceUserRoleNames } from '../../../../store/types/cf-user.types';
import { CfRoleChange } from '../../../../store/types/users-roles.types';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CfRolesService } from '../manage-users/cf-roles.service';
import { UsersRolesConfirmComponent } from '../manage-users/manage-users-confirm/manage-users-confirm.component';

@Component({
selector: 'app-remove-user',
  templateUrl: './remove-user.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CfRolesService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    UsersRolesConfirmComponent
  ]
})
export class RemoveUserComponent implements AfterViewInit, OnDestroy {
  private store = inject<Store<AppState>>(Store);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfUserService = inject(CfUserService);
  private cfRolesService = inject(CfRolesService);
  private route = inject(ActivatedRoute);
  private userPerms = inject(CurrentUserPermissionsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  initialUsers$!: Observable<CfUser[]>;
  singleUser$!: Observable<CfUser>;
  defaultCancelUrl!: string;
  cfGuid!: string;
  orgGuid!: string;
  spaceGuid!: string;
  // FWT-959 Part 2: applyStarted promoted to a signal so the confirm step's
  // canClose / disablePrevious / destructiveStep / finishButtonText handle
  // fields can be `computed()` over it. The legacy boolean read/write API
  // is kept via a getter/setter pair so the existing imperative call-sites
  // (e.g. inside `submit`) don't need to learn signal syntax.
  applyStartedSignal = signal<boolean>(false);
  get applyStarted(): boolean { return this.applyStartedSignal(); }
  set applyStarted(v: boolean) { this.applyStartedSignal.set(v); }
  onlySpaces = false;
  isBlocked$!: Observable<boolean>;

  // FWT-959 Part 2: SignalStepHandle for the single Confirm step.
  //
  // Two-click apply semantic preserved via submit():
  //   1st click (applyStarted == false) — dispatch UsersRolesExecuteChanges,
  //     flip applyStarted, return { ignoreSuccess: true } so the stepper
  //     does NOT auto-advance / does NOT pop a success snackbar.
  //   2nd click (applyStarted == true) — return void after explicit
  //     Router.navigate to the cancel URL (replaces legacy redirect: true).
  //
  // canClose / destructiveStep / finishButtonText are computed() over the
  // applyStartedSignal so the bottom bar flips reactively as soon as the
  // first click lands.
  @ViewChild('confirm', { static: false }) confirm!: UsersRolesConfirmComponent;

  private isBlockedSig = signal<boolean>(true);
  private isBlockedSub?: Subscription;

  confirmStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    blocked: this.isBlockedSig.asReadonly(),
    canClose: computed(() => !this.applyStartedSignal()),
    disablePrevious: computed(() => this.applyStartedSignal()),
    destructiveStep: computed(() => !this.applyStartedSignal()),
    finishButtonText: computed(() => this.applyStartedSignal() ? 'Close' : 'Apply'),
    onEnter: () => this.confirm?.onEnter(),
    submit: async () => {
      if (this.applyStartedSignal()) {
        // Second click — close the wizard. Replaces legacy { redirect: true }
        // (no payload), which the stepper handled by navigating to its
        // cancel URL. We do that explicitly here.
        await this.router.navigateByUrl(this.defaultCancelUrl);
        return;
      }
      this.applyStartedSignal.set(true);
      this.store.dispatch(new UsersRolesExecuteChanges());
      // First click — apply has started; suppress auto-advance and the
      // success snackbar so the user can see the per-row monitor while
      // the dispatched changes settle.
      return { ignoreSuccess: true };
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);
    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activeRouteCfOrgSpace.orgGuid;
    this.spaceGuid = this.activeRouteCfOrgSpace.spaceGuid;
    this.onlySpaces = this.route.snapshot.queryParams.spaces === 'true';

    const userQParam = this.route.snapshot.queryParams.user;
    if (userQParam) {
      this.singleUser$ = this.cfUserService.getUser(activeRouteCfOrgSpace.cfGuid, userQParam)
        .pipe(
          map(user => user.entity),
          take(1)
        );
    } else {
      console.error('User param not defined');
      return;
    }

    const cfGuid$ = this.store.select(selectCfUsersRoles).pipe(
      combineLatest(this.singleUser$),
      take(1)
    );
    // Ensure that when we arrive here directly the store is set up with all it needs
    cfGuid$.subscribe(([usersRoles, user]) => {
      if (!usersRoles.cfGuid || !user) {
        this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, [user]));
      }
    });

    this.isBlocked$ = cfGuid$.pipe(
      filter(res => !!res),
      map(() => false),
      startWith(true),
    );

    this.cfRolesService.existingRoles$.pipe(
      combineLatest(this.singleUser$),
      take(1),
    ).subscribe(([existingRoles, user]) => {
      const orgs = existingRoles[user.guid];
      const changes = this.getRolesChanges(user, orgs);

      obsCombineLatest(...this.getChangesObservables(changes)).pipe(
        map(([...canChanges]) => canChanges),
        take(1)
      ).subscribe((canChanges) => {
        const allowedChanges = canChanges.filter((c) => c.can).map(c => c.change);
        this.store.dispatch(new UsersRolesSetChanges(allowedChanges));
      });
    });
  }

  ngAfterViewInit(): void {
    // Bridge isBlocked$ into a signal so the handle's `blocked` field
    // re-evaluates reactively once the store data is ready. OnPush parent
    // → signal read inside the handle gives us the same gating behaviour
    // the legacy `[blocked]="isBlocked$ | async"` template binding had.
    this.isBlockedSub = this.isBlocked$.subscribe(v => {
      this.isBlockedSig.set(!!v);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.isBlockedSub?.unsubscribe();
    this.store.dispatch(new UsersRolesClear());
  }

  getChangesObservables(changes: CfRoleChange[]) {
    return changes.map((c) => {
      const isOrgRole = !c.spaceGuid;

      if (isOrgRole) {
        return this.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfGuid, c.orgGuid).pipe(
          map((can) => ({ can, change: c }))
        );
      }

      return this.userPerms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, this.cfGuid, c.orgGuid, c.spaceGuid).pipe(
        map((can) => ({ can, change: c }))
      );
    });
  }

  getRolesChanges(user: CfUser, orgs: any) {
    const changes = [];
    const orgGuids = this.orgGuid ? [this.orgGuid] : Object.keys(orgs);

    for (const orgGuid of orgGuids) {
      const org: IUserPermissionInOrg = orgs[orgGuid];

      changes.push(...this.getOrgRolesChanges(user, org));
      changes.push(...this.getSpacesRolesChanges(user, org.spaces));
    }

    return changes;
  }

  getOrgRolesChanges(user: CfUser, org: IUserPermissionInOrg): CfRoleChange[] {
    const changes: CfRoleChange[] = [];

    if (!this.spaceGuid && !this.onlySpaces) {
      const roles = org.permissions;

      for (const role of Object.keys(roles)) {
        const assigned = roles[role];

        if (assigned) {
          changes.push({
            userGuid: user.guid,
            orgGuid: org.orgGuid,
            orgName: org.name,
            add: false,
            role: role as OrgUserRoleNames });
        }
      }
    }

    return changes;
  }

  getSpacesRolesChanges(user: CfUser, spaces: { [spaceGuid: string]: IUserPermissionInSpace }): CfRoleChange[] {
    const changes: CfRoleChange[] = [];
    const spaceGuids = this.spaceGuid ? [this.spaceGuid] : Object.keys(spaces);

    for (const spaceGuid of spaceGuids) {
      const space: IUserPermissionInSpace = spaces[spaceGuid];
      const roles = space.permissions;

      for (const role of Object.keys(roles)) {
        const assigned = roles[role];

        if (assigned) {
          changes.push({
            userGuid: user.guid,
            orgGuid: space.orgGuid,
            orgName: space.orgName,
            spaceGuid,
            spaceName: space.name,
            add: false,
            role: role as SpaceUserRoleNames });
        }
      }
    }

    return changes;
  }

  /**
   * Determine where the return url should be. This will only apply when user visits modal directly (otherwise stepper uses previous state)
   */
  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    let route = `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users`;
    return route;
  }
}
