import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, Signal, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { take,
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  defaultIfEmpty,
  map,
  startWith,
} from 'rxjs/operators';

import {
  TailwindSnackBarService,
  TailwindSnackBarRef,
  EnumerateComponent,
} from '@stratosui/core';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { CfUserRolesSelected, CfRoleChange } from '../../../../../store/types/users-roles.types';
import { RoleAssignmentComponent } from '../../../../../shared/components/role-assignment/role-assignment.component';

interface CfUserWithWarning extends StUser {
  showWarning: boolean;
}

@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EnumerateComponent,
    RoleAssignmentComponent,
  ]
})
export class UsersRolesModifyComponent implements OnInit, OnDestroy {
  protected activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfRolesService = inject(CfRolesService);
  private snackBar = inject(TailwindSnackBarService);
  private rolesData = inject(CfUsersRolesDataService);

  private picked$ = toObservable(this.rolesData.users);
  private isRemove$$ = toObservable(this.rolesData.isRemove);
  private isSetByUsername$$ = toObservable(this.rolesData.isSetByUsername);

  @Input() setUsernames = false;

  /** Signal exposing rolesData.users for template + tests. */
  readonly rolesDataUsers: Signal<StUser[]> = this.rolesData.users;

  /** Baseline roles from existingRoles$ — reactive, fed into the widget. */
  readonly baseline = toSignal(this.cfRolesService.existingRoles$.pipe(startWith({} as CfUserRolesSelected)), { requireSync: true });

  /** Org name resolved from fetchOrgEntity (org-scoped wizard entry). */
  private readonly orgName = signal<string>('');

  /**
   * lockedOrg: non-null when the wizard was opened at org or space scope.
   * Computed so updates to orgName signal flow through reactively.
   */
  readonly lockedOrg = computed<{ guid: string; name: string } | undefined>(() => {
    const orgGuid = this.activeRouteCfOrgSpace.orgGuid;
    if (!orgGuid) {
      return undefined;
    }
    return { guid: orgGuid, name: this.orgName() };
  });

  private snackBarRef: TailwindSnackBarRef<any> | null = null;

  usersNames$!: Observable<string[]>;
  blocked = signal<boolean>(true);
  blocked$: Observable<boolean> = toObservable(this.blocked).pipe(delay(0));
  /** valid$ = inverse of blocked$; consumed by manage-users.component to enable Next. */
  valid$: Observable<boolean> = toObservable(this.blocked).pipe(delay(0), map(b => !b));
  isSetByUsername$!: Observable<boolean | undefined>;
  isRemove$!: Observable<boolean | undefined>;
  usersWithWarning$!: Observable<string[]>;

  private subs: Subscription[] = [];

  ngOnInit() {
    if (this.setUsernames) {
      this.blocked.set(false);
    } else {
      this.subs.push(this.cfRolesService.loading$.subscribe(loading => this.blocked.set(loading)));
    }

    // Resolve org name for lockedOrg at org/space scope
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.cfRolesService.fetchOrgEntity(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid).pipe(
        take(1),
        defaultIfEmpty(null)
      ).subscribe(org => {
        if (org) {
          this.orgName.set(org.entity.name);
          this.rolesData.setOrg(this.activeRouteCfOrgSpace.orgGuid, org.entity.name);
        }
      });
    }

    const users$: Observable<CfUserWithWarning[]> = this.picked$.pipe(
      filter(users => !!users),
      distinctUntilChanged(),
      map(users => users.map(this.mapUser.bind(this)))
    );

    this.usersNames$ = users$.pipe(
      map(users => users.map(user => user.showWarning ? '*' + user.username : user.username))
    );

    this.usersWithWarning$ = users$.pipe(
      map(users => users.filter(user => !!user.showWarning).map(user => user.username))
    );

    this.isSetByUsername$ = this.isSetByUsername$$;
    this.isRemove$ = this.isRemove$$;
  }

  private mapUser(user: StUser): CfUserWithWarning {
    const missingRoles = (user as { missingRoles?: { org: unknown[]; space: unknown[] } }).missingRoles;
    const showWarning = !!missingRoles &&
      ((!!missingRoles.org.length && !this.activeRouteCfOrgSpace.orgGuid) ||
        (!!missingRoles.space.length && !this.activeRouteCfOrgSpace.spaceGuid));
    const newUser = {
      ...user,
      showWarning,
      username: user.username || user.guid
    };
    return newUser;
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  /** Called by the role-assignment widget on every edit. */
  onChangeSet(changes: CfRoleChange[]): void {
    this.rolesData.setChanges(changes);
    this.blocked.set(changes.length === 0);
  }

  onEnter = () => {
    if (!this.snackBarRef) {
      this.usersWithWarning$.pipe(take(1)).subscribe((usersWithWarning => {
        if (usersWithWarning && usersWithWarning.length) {
          this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
          navigate to a specific organization or space`, 'Dismiss');
        }
      }));
    }

    // In order to show the removed roles correctly (as ticks) flip them from remove to add
    this.isRemove$$.pipe(take(1)).subscribe(isRemove => {
      if (isRemove) {
        this.rolesData.flipSetRoles();
      }
    });
  };

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  };

  onNext = () => {
    return this.isRemove$$.pipe(
      take(1),
      map(isRemove => {
        if (isRemove) {
          this.rolesData.flipSetRoles();
        }
        return { success: true };
      }),
      catchError(_err => observableOf({ success: false })),
    );
  };
}
