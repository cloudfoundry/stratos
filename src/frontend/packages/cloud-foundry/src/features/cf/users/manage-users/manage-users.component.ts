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
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest as observableCombineLatest, firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { take, combineLatest, filter, map } from 'rxjs/operators';

import { PageHeaderComponent, SignalStepHandle, StepComponent, SteppersComponent } from '@stratosui/core';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { CfUsersPagedDataService } from '../../../../shared/data-services/cf-users-paged-data.service';
import { StUser } from '../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CfRolesService } from './cf-roles.service';
import { UsersRolesConfirmComponent } from './manage-users-confirm/manage-users-confirm.component';
import { UsersRolesModifyComponent } from './manage-users-modify/manage-users-modify.component';
import { ManageUsersSetUsernamesComponent } from './manage-users-set-usernames/manage-users-set-usernames.component';


@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    ManageUsersSetUsernamesComponent,
    UsersRolesModifyComponent,
    UsersRolesConfirmComponent
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfRolesService
  ]
})
export class UsersRolesComponent implements AfterViewInit, OnDestroy {
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private usersData = inject(CfUsersPagedDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private rolesData = inject(CfUsersRolesDataService);

  initialUsers$!: Observable<StUser[]>;
  singleUser$!: Observable<StUser | null>;
  defaultCancelUrl!: string;
  // FWT-959 Part 2: applyStarted promoted to a signal so the confirm step's
  // canClose / disablePrevious / destructiveStep / finishButtonText handle
  // fields can be `computed()` over it. The legacy boolean read/write API
  // is kept via a getter/setter pair so the existing imperative call-sites
  // don't need to learn signal syntax.
  applyStartedSignal = signal<boolean>(false);
  get applyStarted(): boolean { return this.applyStartedSignal(); }
  set applyStarted(v: boolean) { this.applyStartedSignal.set(v); }
  setUsernames = false;
  title$!: Observable<string>;

  // FWT-959 Part 2: SignalStepHandle wiring for the 3-step manage-users
  // flow. The first step (`Usernames`) is rendered conditionally via the
  // `@if (setUsernames)` template guard (setUsernames is set in the
  // constructor and never flips, so a static template gate suffices —
  // no signal-handle `hidden` field needed). The `setUsers` / `modify` /
  // `confirm` children own most of the per-step state (validity, blocked,
  // onEnter, onLeave, onNext) so each handle is mostly a thin delegating
  // shell.
  //
  // Cross-step state lives in the signal-native CfUsersRolesDataService
  // (setUsers / executeChanges / etc.) — no parent-owned signal
  // coordination needed beyond `applyStartedSignal`.
  @ViewChild('setUsers', { static: false }) setUsers?: ManageUsersSetUsernamesComponent;
  @ViewChild('modify', { static: false }) modify!: UsersRolesModifyComponent;
  @ViewChild('confirm', { static: false }) confirm!: UsersRolesConfirmComponent;

  private setUsersValid = signal<boolean>(false);
  private setUsersBlocked = signal<boolean>(false);
  private modifyValid = signal<boolean>(false);
  private modifyBlocked = signal<boolean>(true);
  private bridgeSubs: Subscription[] = [];

  setUsernamesStepHandle: SignalStepHandle = {
    valid: this.setUsersValid.asReadonly(),
    blocked: this.setUsersBlocked.asReadonly(),
    submit: async () => {
      // setUsers.onNext returns of({ success: true }) after seeding the
      // wizard service with the picked users — we wait for it so the
      // service is primed before the modify step's onEnter runs.
      const result = await firstValueFrom(this.setUsers!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to set usernames');
      }
    },
  };

  modifyStepHandle: SignalStepHandle = {
    valid: this.modifyValid.asReadonly(),
    blocked: this.modifyBlocked.asReadonly(),
    onEnter: () => this.modify?.onEnter(),
    onLeave: (isNext?: boolean) => this.modify?.onLeave(!!isNext),
    submit: async () => {
      const result = await firstValueFrom(this.modify.onNext());
      if (!result.success) {
        throw new Error('Failed to update roles');
      }
    },
  };

  confirmStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    canClose: computed(() => !this.applyStartedSignal()),
    disablePrevious: computed(() => this.applyStartedSignal()),
    destructiveStep: computed(() => !this.applyStartedSignal()),
    finishButtonText: computed(() => this.applyStartedSignal() ? 'Close' : 'Apply'),
    onEnter: () => this.confirm?.onEnter(),
    submit: async () => {
      // Two-click apply semantic — see remove-user for the long form.
      // First click dispatches the changes and returns ignoreSuccess so
      // the per-row monitor stays visible; second click navigates back.
      if (this.applyStartedSignal()) {
        await this.router.navigateByUrl(this.defaultCancelUrl);
        return;
      }
      this.applyStartedSignal.set(true);
      await this.rolesData.executeChanges();
      return { ignoreSuccess: true };
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;
    const route = this.route;


    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    // Setup the stepper with the users that will have their roles managed
    this.setUsernames = route.snapshot.queryParams.setByUsername;
    if (this.setUsernames) {
      // User has yet to supply users to manage. This will be handled by the first step
      this.singleUser$ = of(null);
    } else {
      // `?users=g1,g2,g3` selects multiple users (the bulk Manage Roles
      // path); `?user=g1` is the single-user shorthand. Falls back to the
      // already-picked users in the wizard state.
      const usersQParam = this.route.snapshot.queryParams.users;
      const userQParam = this.route.snapshot.queryParams.user;
      if (usersQParam) {
        const guids = (usersQParam as string).split(',').map(g => g.trim()).filter(Boolean);
        this.initialUsers$ = observableCombineLatest(
          guids.map(guid => this.usersData.getUser(activeRouteCfOrgSpace.cfGuid, guid))
        ).pipe(
          // getUser emits StUser | undefined; drop any guid that didn't resolve
          // so the wizard is never seeded with a hole in the picked-users array.
          map(users => users.filter((user): user is StUser => !!user)),
          take(1)
        );
      } else if (userQParam) {
        this.initialUsers$ = this.usersData.getUser(activeRouteCfOrgSpace.cfGuid, userQParam).pipe(
          map(user => user ? [user] : []),
          take(1)
        );
      } else {
        this.initialUsers$ = toObservable(this.rolesData.users).pipe(take(1));
      }

      this.singleUser$ = this.initialUsers$.pipe(
        take(1),
        filter(users => users && users.length > 0),
        map(users => users.length === 1 ? users[0] : null),
      );

      // Ensure that when we arrive here directly the store is set up with all it needs
      toObservable(this.rolesData.state).pipe(
        combineLatest(this.initialUsers$),
        take(1)
      ).subscribe(([usersRoles, users]) => {
        if (!usersRoles?.cfGuid || !users) {
          this.rolesData.setUsers(activeRouteCfOrgSpace.cfGuid, users);
        }
      });
    }

    this.title$ = this.singleUser$.pipe(
      map(singleUser => singleUser ? `Manage Roles: ${singleUser.username}` : `Manage User Roles`)
    );
  }

  ngAfterViewInit(): void {
    // Bridge child Observable surfaces into the local signals the handles
    // read so the stepper re-evaluates blocked/valid reactively.
    if (this.setUsers) {
      this.bridgeSubs.push(
        this.setUsers.valid$.subscribe(v => {
          this.setUsersValid.set(!!v);
          this.cdr.markForCheck();
        }),
      );
      this.bridgeSubs.push(
        this.setUsers.blocked$.subscribe(v => {
          this.setUsersBlocked.set(!!v);
          this.cdr.markForCheck();
        }),
      );
    }
    if (this.modify) {
      this.bridgeSubs.push(
        this.modify.valid$.subscribe(v => {
          this.modifyValid.set(!!v);
          this.cdr.markForCheck();
        }),
      );
      this.bridgeSubs.push(
        this.modify.blocked$.subscribe(v => {
          this.modifyBlocked.set(!!v);
          this.cdr.markForCheck();
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.bridgeSubs.forEach(s => s.unsubscribe());
    this.rolesData.clear();
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
