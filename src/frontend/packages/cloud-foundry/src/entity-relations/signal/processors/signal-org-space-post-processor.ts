// Pure replacement for `processors/org-space-post-processor.ts`. The
// legacy version dispatched a WrapperRequestActionSuccess to merge new
// role flags onto users in the ngrx store. The signal-native version
// returns the role-mirror writes via the SignalRelationPostProcessorContext
// `upsert` callback so the cloud-foundry data services can apply them
// to their own user signals once they migrate.
//
// Logic mirrors `updateUser()` in the legacy file: for each role param
// on the org/space entity, walk the listed user guids and add the
// org/space guid into the user's matching `*_organizations` or
// `*_spaces` array (de-duplicated). Org and space role tables come
// straight from `OrgUserRoleNames -> CfUserRoleParams` /
// `SpaceUserRoleNames -> CfUserRoleParams` mappings.

import { organizationEntityType, spaceEntityType, cfUserEntityType } from '../../../cf-entity-types';
import {
  CfUserRoleParams,
  OrgUserRoleNames,
  SpaceUserRoleNames,
} from '../../../store/types/cf-user.types';
import {
  RelationFetchResult,
  SignalRelationPostProcessor,
  SignalRelationPostProcessorContext,
} from '../signal-relation-types';

const ORG_ROLE_TABLE: ReadonlyArray<{ source: OrgUserRoleNames; target: CfUserRoleParams }> = [
  { source: OrgUserRoleNames.USER, target: CfUserRoleParams.ORGANIZATIONS },
  { source: OrgUserRoleNames.MANAGER, target: CfUserRoleParams.MANAGED_ORGS },
  { source: OrgUserRoleNames.BILLING_MANAGERS, target: CfUserRoleParams.BILLING_MANAGER_ORGS },
  { source: OrgUserRoleNames.AUDITOR, target: CfUserRoleParams.AUDITED_ORGS },
];

const SPACE_ROLE_TABLE: ReadonlyArray<{ source: SpaceUserRoleNames; target: CfUserRoleParams }> = [
  { source: SpaceUserRoleNames.DEVELOPER, target: CfUserRoleParams.SPACES },
  { source: SpaceUserRoleNames.MANAGER, target: CfUserRoleParams.MANAGED_SPACES },
  { source: SpaceUserRoleNames.AUDITOR, target: CfUserRoleParams.AUDITED_SPACES },
];

interface OrgOrSpacePayload {
  guid?: string;
  metadata?: { guid: string };
  entity?: Record<string, unknown> & { guid?: string };
}

function entityGuid(payload: OrgOrSpacePayload | unknown): string | undefined {
  const p = payload as OrgOrSpacePayload | null;
  if (!p) return undefined;
  return p.metadata?.guid ?? p.entity?.guid ?? p.guid;
}

function entityBody(payload: OrgOrSpacePayload | unknown): Record<string, unknown> | undefined {
  const p = payload as OrgOrSpacePayload | null;
  if (!p) return undefined;
  return p.entity ?? (p as Record<string, unknown>);
}

/**
 * Apply the org/space role table to a single parent payload. Writes
 * roles via ctx.upsert keyed by user guid. Pure — no I/O.
 */
export function applyOrgSpaceRoles(
  parentEntityType: string,
  parents: ReadonlyArray<unknown>,
  ctx: SignalRelationPostProcessorContext,
): void {
  const table = parentEntityType === organizationEntityType
    ? ORG_ROLE_TABLE
    : parentEntityType === spaceEntityType
      ? SPACE_ROLE_TABLE
      : null;
  if (!table) {
    return;
  }
  for (const parent of parents) {
    const parentGuid = entityGuid(parent);
    const body = entityBody(parent);
    if (!parentGuid || !body) {
      continue;
    }
    for (const { source, target } of table) {
      const userIds = body[source];
      if (!Array.isArray(userIds)) {
        continue;
      }
      for (const userId of userIds) {
        if (typeof userId !== 'string') {
          continue;
        }
        ctx.upsert(cfUserEntityType, userId, { [target]: [parentGuid] });
      }
    }
  }
}

export const signalOrgPostProcessor: SignalRelationPostProcessor = {
  rootEntityType: organizationEntityType,
  run: (parents, _fetched: RelationFetchResult, ctx) => {
    applyOrgSpaceRoles(organizationEntityType, parents, ctx);
  },
};

export const signalSpacePostProcessor: SignalRelationPostProcessor = {
  rootEntityType: spaceEntityType,
  run: (parents, _fetched: RelationFetchResult, ctx) => {
    applyOrgSpaceRoles(spaceEntityType, parents, ctx);
  },
};
