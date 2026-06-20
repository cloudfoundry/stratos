import { firstValueFrom } from 'rxjs';
import { CfRoleChange } from '../../../store/types/users-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import type { StUser } from '../../../services/endpoint-data/stratos-types';
import type { CfUsersRolesDataService } from '../../../services/domain-data/cf-users-roles-data.service';
import type { UserInviteService, UserInviteSendSpaceRoles } from '../../../features/cf/user-invites/user-invite.service';
import type { TailwindSnackBarService } from '@stratosui/core';
import type { CfUsersPagedDataService } from '../../data-services/cf-users-paged-data.service';
import type { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';

export interface AddRoleSelection {
  orgRoles: OrgUserRoleNames[];
  spaceRolesBySpace: Record<string, SpaceUserRoleNames[]>;
}

export interface BuildAddOpts {
  orgGuid: string;
  orgName: string;
  spaceNameByGuid?: Map<string, string>;
  selection: AddRoleSelection;
}

/** Build add:true role-grant changes for the given users. */
export function buildAddChanges(userGuids: string[], opts: BuildAddOpts): CfRoleChange[] {
  const out: CfRoleChange[] = [];
  for (const userGuid of userGuids) {
    for (const role of opts.selection.orgRoles) {
      out.push({ userGuid, orgGuid: opts.orgGuid, orgName: opts.orgName, add: true, role });
    }
    for (const [spaceGuid, roles] of Object.entries(opts.selection.spaceRolesBySpace)) {
      for (const role of roles) {
        out.push({
          userGuid, orgGuid: opts.orgGuid, orgName: opts.orgName,
          spaceGuid, spaceName: opts.spaceNameByGuid?.get(spaceGuid), add: true, role,
        });
      }
    }
  }
  return out;
}

// ─── addUsers orchestrator ───────────────────────────────────────────────────

export type AddMode = 'associate' | 'invite';

export interface AddUsersDeps {
  rolesData: CfUsersRolesDataService;
  invite: UserInviteService;
  snackBar: TailwindSnackBarService;
  paged: CfUsersPagedDataService;
  snapshot: CnsiUsersSnapshotService;
  cfGuid: string;
}

export interface AddUsersRequest {
  mode: AddMode;
  /** Usernames (associate) or emails (invite). */
  identities: string[];
  /** Identity-provider origin — associate only; '' allowed. */
  origin: string;
  orgGuid: string;
  orgName: string;
  spaceNameByGuid?: Map<string, string>;
  /** Role selection; may be empty (no roles). */
  selection: AddRoleSelection;
}

/**
 * Outcome summary so the caller (dialog) can decide whether to close.
 * `total` = identities attempted; `failed` = count of failures on the path
 * taken; `ok` = failed === 0 (full success).
 */
export interface AddUsersSummary {
  ok: boolean;
  total: number;
  failed: number;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Build a synthetic StUser from a username.
 *
 * Mirrors ManageUsersSetUsernamesHelper.createGuid() + the component's onNext():
 * the guid is "username/cfGuid/orgGuid" — the shape executeChanges expects when
 * setIsSetByUsername is true, so the backend resolves by username+origin.
 */
function makeSyntheticStUser(username: string, cfGuid: string, orgGuid: string): StUser {
  return {
    username,
    guid: `${username}/${cfGuid}/${orgGuid}`,
    cnsiGuid: cfGuid,
    orgRoles: [],
    spaceRoles: [],
  };
}

/**
 * Build a minimal StUser from a real CF user guid (returned by invite).
 * Username is left empty — the backend already has the real user; guid is
 * the real CF guid, so setIsSetByUsername must be false for this path.
 */
function stUserFromGuid(guid: string, cfGuid: string): StUser {
  return {
    username: '',
    guid,
    cnsiGuid: cfGuid,
    orgRoles: [],
    spaceRoles: [],
  };
}

/**
 * Return the first space guid from the selection (for the invite endpoint's
 * `space` arg), or '' if org-only.
 */
function firstSpaceGuid(req: AddUsersRequest): string {
  const keys = Object.keys(req.selection.spaceRolesBySpace);
  return keys.length > 0 ? keys[0] : '';
}

/**
 * Return true when at least one role is selected in the request.
 */
function hasRoles(req: AddUsersRequest): boolean {
  return req.selection.orgRoles.length > 0 ||
    Object.values(req.selection.spaceRolesBySpace).some(roles => roles.length > 0);
}

/**
 * Post the orchestrator-framed snackbar without touching caches.
 * Used on execute paths where executeChanges already owns the refresh.
 */
function reportSnackBar(
  deps: AddUsersDeps,
  failedCount: number,
  totalCount: number,
): void {
  if (failedCount > 0) {
    deps.snackBar.error(
      `Added ${totalCount - failedCount} of ${totalCount} user${totalCount === 1 ? '' : 's'}; ${failedCount} failed`,
    );
  } else {
    deps.snackBar.open(`Added ${totalCount} user${totalCount === 1 ? '' : 's'}`);
  }
}

/**
 * Read applyStatus, snackbar the partial-success summary, then refresh
 * the user caches. Used only on the associate-no-roles path (which never
 * calls executeChanges and therefore owns its own refresh).
 */
function reportAndRefresh(
  deps: AddUsersDeps,
  failedCount: number,
  totalCount: number,
): void {
  deps.paged.markStale(deps.cfGuid);
  deps.snapshot.refreshIfLoaded(deps.cfGuid);
  reportSnackBar(deps, failedCount, totalCount);
}

/**
 * Read applyStatus after executeChanges and report partial failures via
 * snackbar only — executeChanges already refreshed the caches, so no
 * double-refresh here.
 *
 * `userGuids` is the list of synthetic/real guids that were passed to
 * executeChanges. The changeKey format is `${userGuid}/...` — a user is
 * counted as "failed" if ANY of its role-change keys is in error state.
 * This keeps `failed` identity-scoped (≤ total) rather than change-scoped.
 */
function reportFromApplyStatus(
  deps: AddUsersDeps,
  totalCount: number,
  userGuids: string[],
): number {
  const status = deps.rolesData.applyStatus();
  const errorKeys = new Set(
    Object.entries(status).filter(([, s]) => s === 'error').map(([k]) => k),
  );
  const failedCount = userGuids.filter(
    guid => [...errorKeys].some(k => k.startsWith(`${guid}/`)),
  ).length;
  reportSnackBar(deps, failedCount, totalCount);
  return failedCount;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Add users to the CF foundation (associate or invite), optionally granting
 * a role selection. The three flows:
 *
 *   associate + roles  — seed synthetic StUsers by username+origin, call
 *                        executeChanges (which auto-associates before granting).
 *   associate, no roles — call associateUser per username; no role machinery.
 *   invite             — role-free invite → grant full matrix by returned guids.
 *
 * Never rejects on partial failure — failures are reported via snackBar and
 * the cache is refreshed. The caller (dialog) decides whether to close,
 * using the returned summary (ok/total/failed).
 */
export async function addUsers(deps: AddUsersDeps, req: AddUsersRequest): Promise<AddUsersSummary> {
  const total = req.identities.length;
  const summary = (failed: number): AddUsersSummary => ({ ok: failed === 0, total, failed });

  if (req.mode === 'associate') {
    if (!hasRoles(req)) {
      // Associate-only: no role machinery; call associateUser per identity.
      const results = await Promise.allSettled(
        req.identities.map(username => deps.rolesData.associateUser(deps.cfGuid, username, req.origin)),
      );
      const failedCount = results.filter(r => r.status === 'rejected').length;
      reportAndRefresh(deps, failedCount, req.identities.length);
      return summary(failedCount);
    }

    // Associate + roles: seed synthetic users by username+origin; executeChanges
    // auto-associates before granting (do NOT also call associateUser).
    const syntheticUsers = req.identities.map(
      username => makeSyntheticStUser(username, deps.cfGuid, req.orgGuid),
    );
    const syntheticGuids = syntheticUsers.map(u => u.guid);
    deps.rolesData.setUsers(deps.cfGuid, syntheticUsers, req.origin);
    deps.rolesData.setIsSetByUsername(true);
    deps.rolesData.setChanges(buildAddChanges(syntheticGuids, {
      orgGuid: req.orgGuid,
      orgName: req.orgName,
      spaceNameByGuid: req.spaceNameByGuid,
      selection: req.selection,
    }));
    await deps.rolesData.executeChanges({ silent: true });
    const failedCount = reportFromApplyStatus(deps, req.identities.length, syntheticGuids);
    return summary(failedCount);
  }

  // Invite mode: role-free invite, then grant full matrix by returned guids.
  // Pass '' as the spaceRole sentinel — invite() treats a falsy spaceRole as
  // genuinely role-free and sends spaceRoles: {} on the wire.
  const resp = await firstValueFrom(
    deps.invite.invite(
      deps.cfGuid,
      req.orgGuid,
      firstSpaceGuid(req),
      '' as UserInviteSendSpaceRoles,
      req.identities,
    ),
  );

  const newGuids = (resp.new_invites ?? []).map(i => i.userid).filter(Boolean);
  const failedCount = (resp.failed_invites ?? []).length;

  if (newGuids.length > 0 && hasRoles(req)) {
    const invitedUsers = newGuids.map(guid => stUserFromGuid(guid, deps.cfGuid));
    deps.rolesData.setUsers(deps.cfGuid, invitedUsers);
    deps.rolesData.setIsSetByUsername(false);
    deps.rolesData.setChanges(buildAddChanges(newGuids, {
      orgGuid: req.orgGuid,
      orgName: req.orgName,
      spaceNameByGuid: req.spaceNameByGuid,
      selection: req.selection,
    }));
    await deps.rolesData.executeChanges({ silent: true });
    // Report combined: invite failures + any role-grant failures.
    // executeChanges owns the cache refresh; orchestrator posts the snackbar only.
    const grantStatus = deps.rolesData.applyStatus();
    const grantFailedCount = Object.values(grantStatus).filter(s => s === 'error').length;
    reportSnackBar(deps, failedCount + grantFailedCount, req.identities.length);
    return summary(failedCount + grantFailedCount);
  }

  // Invite only (no roles, or all invites failed) — executeChanges not called,
  // so the orchestrator owns the refresh here.
  reportAndRefresh(deps, failedCount, req.identities.length);
  return summary(failedCount);
}
