import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TailwindSnackBarService } from '@stratosui/core';
import { firstValueFrom } from 'rxjs';

import {
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  OrgUserRoleNames,
  SpaceUserRoleNames,
  createUserRoleInOrg,
  createUserRoleInSpace,
} from '../../store/types/cf-user.types';
import { StUser } from '../endpoint-data/stratos-types';
import { CfRoleChange, UsersRolesState } from '../../store/types/users-roles.types';

// Signal-native owner of the Manage Roles / Remove User wizard state. This
// replaces the legacy `manageUsersRoles` NgRx slice (actions + reducer +
// selectors + execute effect): state lives in writable signals here, and
// `executeChanges` calls the native batch role-change endpoint directly
// instead of dispatching entity actions and monitoring entity updates.
//
// Read surface (cfGuid / users / newRoles / orgGuid / changedRoles /
// isRemove / isSetByUsername / state) is preserved so existing consumers
// keep working; the mutation methods replace the previous `inject(Store)`
// + dispatch legs.
export type RoleChangeApplyState = 'busy' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class CfUsersRolesDataService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(TailwindSnackBarService);

  private readonly _cfGuid = signal<string>('');
  private readonly _users = signal<StUser[]>([]);
  private readonly _newRoles = signal<IUserPermissionInOrg>(createDefaultOrgRoles('', ''));
  private readonly _changedRoles = signal<CfRoleChange[]>([]);
  private readonly _usernameOrigin = signal<string | undefined>(undefined);
  private readonly _isRemove = signal<boolean | undefined>(undefined);
  private readonly _isSetByUsername = signal<boolean | undefined>(undefined);
  private readonly _applyStatus = signal<Record<string, RoleChangeApplyState>>({});

  /** Per-change apply state, keyed by {@link changeKey}, populated by executeChanges. */
  readonly applyStatus: Signal<Record<string, RoleChangeApplyState>> = this._applyStatus.asReadonly();

  /** Stable identity for a role change — used to key applyStatus per row. */
  static changeKey(c: CfRoleChange): string {
    return `${c.userGuid}/${c.orgGuid}/${c.spaceGuid ?? ''}/${c.role}`;
  }

  readonly cfGuid: Signal<string> = this._cfGuid.asReadonly();
  readonly users: Signal<StUser[]> = this._users.asReadonly();
  readonly newRoles: Signal<IUserPermissionInOrg> = this._newRoles.asReadonly();
  readonly changedRoles: Signal<CfRoleChange[]> = this._changedRoles.asReadonly();
  readonly isRemove: Signal<boolean | undefined> = this._isRemove.asReadonly();
  readonly isSetByUsername: Signal<boolean | undefined> = this._isSetByUsername.asReadonly();
  readonly orgGuid: Signal<string> = computed(() => this._newRoles().orgGuid);
  readonly state: Signal<UsersRolesState> = computed(() => ({
    cfGuid: this._cfGuid(),
    users: this._users(),
    newRoles: this._newRoles(),
    changedRoles: this._changedRoles(),
    usernameOrigin: this._usernameOrigin(),
    isRemove: this._isRemove(),
    isSetByUsername: this._isSetByUsername(),
  }));

  /** Seed the wizard with the picked users; clears roles but keeps the org. */
  setUsers(cfGuid: string, users: StUser[], origin?: string): void {
    const current = this._newRoles();
    this._cfGuid.set(cfGuid);
    this._users.set(users);
    this._newRoles.set(createDefaultOrgRoles(current.orgGuid, current.name));
    this._usernameOrigin.set(origin);
  }

  /** Reset to the default empty state (wizard close). */
  clear(): void {
    this._cfGuid.set('');
    this._users.set([]);
    this._newRoles.set(createDefaultOrgRoles('', ''));
    this._changedRoles.set([]);
    this._usernameOrigin.set(undefined);
    this._isRemove.set(undefined);
    this._isSetByUsername.set(undefined);
  }

  /** Switch the org context, resetting the role matrix. */
  setOrg(orgGuid: string, orgName: string): void {
    this._newRoles.set(createDefaultOrgRoles(orgGuid, orgName));
  }

  setOrgRole(orgGuid: string, orgName: string, role: string, setRole: boolean): void {
    const next = applyRoleChange(this._newRoles(), orgGuid, orgName, null, null, role, setRole, !!this._isSetByUsername());
    if (next) {
      this._newRoles.set(next);
    }
  }

  setSpaceRole(orgGuid: string, orgName: string, spaceGuid: string, spaceName: string, role: string, setRole: boolean): void {
    const next = applyRoleChange(this._newRoles(), orgGuid, orgName, spaceGuid, spaceName, role, setRole, !!this._isSetByUsername());
    if (next) {
      this._newRoles.set(next);
    }
  }

  /** Replace the wizard's pending role-change set. */
  setChanges(changes: CfRoleChange[]): void {
    this._changedRoles.set(changes);
  }

  /** Invert the `add` flag on every pending change (remove-confirm flow). */
  flipSetRoles(): void {
    this._changedRoles.update(changes => changes.map(c => ({ ...c, add: !c.add })));
  }

  setIsRemove(isRemove: boolean): void {
    this._isRemove.set(isRemove);
  }

  setIsSetByUsername(isSetByUsername: boolean): void {
    this._isSetByUsername.set(isSetByUsername);
  }

  /**
   * Apply the pending role changes via the native batch endpoint. The
   * backend orders org-user membership relative to other roles and resolves
   * GUIDs for removals, so the wizard just hands over the diff.
   *
   * Drives the per-row `applyStatus` signal (busy → done/error) so the
   * confirm step can show live status, and pops a summary snackbar of the
   * outcome. Never rejects on a per-change failure — the status + snackbar
   * convey it — so the two-click apply flow stays in control of navigation.
   */
  async executeChanges(): Promise<void> {
    const cfGuid = this._cfGuid();
    const changes = this._changedRoles();
    if (!changes.length) {
      return;
    }
    this._applyStatus.set(
      Object.fromEntries(changes.map(c => [CfUsersRolesDataService.changeKey(c), 'busy' as RoleChangeApplyState])),
    );

    // Set-roles-by-username: the picked "users" carry synthetic guids
    // (username/cfGuid/orgGuid) rather than real CF guids, so the wire payload
    // must identify them by username+origin and let the backend resolve/create
    // the user. For the normal path the real guid is sent.
    const byUsername = !!this._isSetByUsername();
    const origin = this._usernameOrigin();
    const usernameByGuid = byUsername
      ? new Map(this._users().map(u => [u.guid, u.username]))
      : undefined;
    const body = {
      changes: changes.map(c => toNativeRoleChange(c, usernameByGuid?.get(c.userGuid), origin)),
    };
    let results: NativeRoleChangeResult[];
    try {
      const resp = await firstValueFrom(
        this.http.post<{ results?: NativeRoleChangeResult[] }>(`/pp/v1/cf/roles/${cfGuid}/changes`, body),
      );
      results = resp?.results ?? [];
    } catch (e) {
      // Whole-request failure — mark everything errored and surface it.
      this._applyStatus.update(s => {
        const next = { ...s };
        for (const key of Object.keys(next)) {
          next[key] = 'error';
        }
        return next;
      });
      this.snackBar.error(`Failed to apply role changes: ${errorMessage(e)}`);
      return;
    }

    const status = { ...this._applyStatus() };
    const errors: string[] = [];
    for (const r of results) {
      const c = changes[r.index];
      if (!c) {
        continue;
      }
      const key = CfUsersRolesDataService.changeKey(c);
      status[key] = r.success ? 'done' : 'error';
      if (!r.success && r.error) {
        errors.push(r.error);
      }
    }
    this._applyStatus.set(status);

    if (errors.length) {
      this.snackBar.error(`${errors.length} of ${changes.length} role changes failed: ${errors.join('; ')}`);
    } else {
      this.snackBar.open(`Applied ${changes.length} role change${changes.length === 1 ? '' : 's'}`);
    }
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

interface NativeRoleChange {
  userGuid?: string;
  username?: string;
  origin?: string;
  orgGuid?: string;
  spaceGuid?: string;
  type: string;
  add: boolean;
}

interface NativeRoleChangeResult {
  index: number;
  success: boolean;
  error?: string;
  jobId?: string;
  state?: string;
}

// Maps a wizard role change to the V3 batch wire shape. Space scope sends
// spaceGuid; org scope sends orgGuid. The short role names collide between
// org and space (e.g. 'managers'), so the scope flag disambiguates. When a
// username is supplied (set-roles-by-username) the user is identified by
// username+origin and the synthetic guid is dropped.
function toNativeRoleChange(c: CfRoleChange, username?: string, origin?: string): NativeRoleChange {
  const type = nativeRoleType(c.role, !!c.spaceGuid);
  const user: Pick<NativeRoleChange, 'userGuid' | 'username' | 'origin'> = username
    ? { username, origin }
    : { userGuid: c.userGuid };
  return c.spaceGuid
    ? { ...user, spaceGuid: c.spaceGuid, type, add: c.add }
    : { ...user, orgGuid: c.orgGuid, type, add: c.add };
}

function nativeRoleType(role: string, isSpace: boolean): string {
  if (isSpace) {
    switch (role) {
      case SpaceUserRoleNames.MANAGER: return 'space_manager';
      case SpaceUserRoleNames.AUDITOR: return 'space_auditor';
      case SpaceUserRoleNames.DEVELOPER: return 'space_developer';
      default: throw new Error(`Unknown space role: ${role}`);
    }
  }
  switch (role) {
    case OrgUserRoleNames.MANAGER: return 'organization_manager';
    case OrgUserRoleNames.BILLING_MANAGERS: return 'organization_billing_manager';
    case OrgUserRoleNames.AUDITOR: return 'organization_auditor';
    case OrgUserRoleNames.USER: return 'organization_user';
    default: throw new Error(`Unknown org role: ${role}`);
  }
}

// ---------------------------------------------------------------------------
// Role-matrix helpers — ported verbatim from the former cf-users-roles
// reducer so the in-progress matrix behaves identically (immutable clones,
// auto-add of the org user role when any other role is applied).

export function createDefaultOrgRoles(orgGuid: string, orgName: string): IUserPermissionInOrg {
  return {
    name: orgName,
    orgGuid,
    permissions: createUserRoleInOrg(undefined, undefined, undefined, undefined),
    spaces: {},
  };
}

export function createDefaultSpaceRoles(orgGuid: string, orgName: string, spaceGuid: string, spaceName: string): IUserPermissionInSpace {
  return {
    name: spaceName,
    spaceGuid,
    orgGuid,
    orgName,
    permissions: createUserRoleInSpace(undefined, undefined, undefined),
  };
}

function setPermission(roles: IUserPermissionInOrg | IUserPermissionInSpace, role: string, applyRole: boolean): boolean {
  if ((roles.permissions as any)[role] === applyRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: applyRole,
  };
  return true;
}

function cloneOrgRoles(orgRoles: IUserPermissionInOrg, orgGuid: string, orgName: string): IUserPermissionInOrg {
  return orgRoles
    ? { ...orgRoles, spaces: { ...orgRoles.spaces } }
    : createDefaultOrgRoles(orgGuid, orgName);
}

function applyRoleChange(
  existing: IUserPermissionInOrg,
  orgGuid: string,
  orgName: string,
  spaceGuid: string | null,
  spaceName: string | null,
  role: string,
  applyRole: boolean,
  isSetByUsername: boolean,
): IUserPermissionInOrg | null {
  let next: IUserPermissionInOrg | null = cloneOrgRoles(existing, orgGuid, orgName);
  if (spaceGuid) {
    next = applySpaceRole(next, orgGuid, orgName, spaceGuid, spaceName as string, role, applyRole, isSetByUsername);
  } else {
    next = applyOrgRole(next, role, applyRole, isSetByUsername);
  }
  if (!next) {
    return null;
  }
  return { ...existing, ...next };
}

function applySpaceRole(
  orgRoles: IUserPermissionInOrg,
  orgGuid: string,
  orgName: string,
  spaceGuid: string,
  spaceName: string,
  role: string,
  applyRole: boolean,
  isSetByUsername: boolean,
): IUserPermissionInOrg {
  if (!orgRoles.spaces![spaceGuid]) {
    orgRoles.spaces![spaceGuid] = createDefaultSpaceRoles(orgGuid, orgName, spaceGuid, spaceName);
  }
  const spaceRoles = orgRoles.spaces![spaceGuid] = { ...orgRoles.spaces![spaceGuid] };
  const changed = setPermission(spaceRoles, role, applyRole);
  // Applying any space role implies org membership.
  if (changed && applyRole && !isSetByUsername) {
    orgRoles.permissions = {
      ...orgRoles.permissions,
      [OrgUserRoleNames.USER]: true,
    };
  }
  return orgRoles;
}

function applyOrgRole(
  orgRoles: IUserPermissionInOrg,
  role: string,
  applyRole: boolean,
  isSetByUsername: boolean,
): IUserPermissionInOrg | null {
  const changed = setPermission(orgRoles, role, applyRole);
  if (!changed) {
    return null;
  }
  // Applying org manager/auditor/billing implies org membership.
  if (role !== 'user' && applyRole && !isSetByUsername) {
    orgRoles.permissions = {
      ...orgRoles.permissions,
      [OrgUserRoleNames.USER]: true,
    };
  }
  return orgRoles;
}
