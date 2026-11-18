import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Signal, ChangeDetectionStrategy, inject, computed, signal, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { take, defaultIfEmpty, startWith } from 'rxjs/operators';

import {
  TailwindSnackBarService,
  TailwindSnackBarRef,
  EnumerateComponent,
  StepOnNextResult,
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

  readonly isRemove = this.rolesData.isRemove;
  readonly isSetByUsername = this.rolesData.isSetByUsername;

  private readonly pickedUsers = computed<CfUserWithWarning[]>(() => (this.rolesData.users() ?? []).map(this.mapUser.bind(this)));
  /** Names of the picked users, starred when not all their roles are known. */
  protected readonly usersNames = computed(() => this.pickedUsers().map(user => user.showWarning ? '*' + user.username : user.username));
  readonly usersWithWarning = computed(() => this.pickedUsers().filter(user => !!user.showWarning).map(user => user.username));

  readonly setUsernames = input(false);

  /** Signal exposing rolesData.users for template + tests. */
  readonly rolesDataUsers: Signal<StUser[]> = this.rolesData.users;

  /** Baseline roles from existingRoles$ — reactive, fed into the widget. */
  readonly baseline = toSignal(this.cfRolesService.existingRoles$.pipe(startWith({} as CfUserRolesSelected)), { requireSync: true });

  /** True while existing roles are still resolving — drives the widget spinner. */
  readonly loadingRoles = toSignal(this.cfRolesService.loading$, { initialValue: true });

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

  /** True once the widget has reported at least one pending role change. */
  private readonly hasChanges = signal(false);

  /**
   * Next is blocked while the existing roles load (not in set-by-username
   * mode, which has none to load) and while there is nothing to apply.
   */
  readonly blocked = computed(() => (!this.setUsernames() && this.loadingRoles()) || !this.hasChanges());
  /** Inverse of blocked; the parent reads it to enable Next. */
  readonly valid = computed(() => !this.blocked());

  ngOnInit() {
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
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  /** Called by the role-assignment widget on every edit. */
  onChangeSet(changes: CfRoleChange[]): void {
    this.rolesData.setChanges(changes);
    this.hasChanges.set(changes.length > 0);
  }

  onEnter = () => {
    if (!this.snackBarRef) {
      const usersWithWarning = this.usersWithWarning();
      if (usersWithWarning.length) {
        this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
        navigate to a specific organization or space`, 'Dismiss');
      }
    }

    // In order to show the removed roles correctly (as ticks) flip them from remove to add
    if (this.isRemove()) {
      this.rolesData.flipSetRoles();
    }
  };

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  };

  async onNext(): Promise<StepOnNextResult> {
    if (this.isRemove()) {
      this.rolesData.flipSetRoles();
    }
    return { success: true };
  }
}
