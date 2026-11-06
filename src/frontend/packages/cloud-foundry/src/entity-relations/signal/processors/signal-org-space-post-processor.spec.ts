import { describe, it, expect } from 'vitest';
import { organizationEntityType, spaceEntityType, cfUserEntityType } from '../../../cf-entity-types';
import { CfUserRoleParams } from '../../../store/types/cf-user.types';
import { SignalRelationPostProcessorContext } from '../signal-relation-types';
import { applyOrgSpaceRoles } from './signal-org-space-post-processor';

// Mirrors the role-mirror logic in the legacy `org-space-post-processor.ts`.
// Pure function, no store — just verifies that for each org/space role
// param the listed user guids gain the inverse role flag.

function makeCtx(): { upserts: { entityType: string; guid: string; row: Record<string, unknown> }[]; ctx: SignalRelationPostProcessorContext } {
  const upserts: { entityType: string; guid: string; row: Record<string, unknown> }[] = [];
  return {
    upserts,
    ctx: {
      cnsiGuid: 'cnsi-1',
      upsert: (entityType, guid, row) => upserts.push({ entityType, guid, row }),
    },
  };
}

describe('Signal Entity Relations - Org/Space role post-processor', () => {
  it('mirrors org roles onto user upserts', () => {
    const orgPayload = {
      metadata: { guid: 'org-1' },
      entity: {
        name: 'org-name',
        managers: ['user-mgr'],
        billing_managers: ['user-bill'],
        auditors: ['user-aud'],
        users: ['user-base'],
      },
    };
    const { ctx, upserts } = makeCtx();

    applyOrgSpaceRoles(organizationEntityType, [orgPayload], ctx);

    expect(upserts).toHaveLength(4);
    // All upserts target the cf-user entity key.
    upserts.forEach(u => expect(u.entityType).toBe(cfUserEntityType));
    // Inverse-role mapping (org user with role X gains org-1 in the
    // matching CfUserRoleParams collection).
    const byUser = new Map(upserts.map(u => [u.guid, u.row]));
    expect(byUser.get('user-mgr')).toEqual({ [CfUserRoleParams.MANAGED_ORGS]: ['org-1'] });
    expect(byUser.get('user-bill')).toEqual({ [CfUserRoleParams.BILLING_MANAGER_ORGS]: ['org-1'] });
    expect(byUser.get('user-aud')).toEqual({ [CfUserRoleParams.AUDITED_ORGS]: ['org-1'] });
    expect(byUser.get('user-base')).toEqual({ [CfUserRoleParams.ORGANIZATIONS]: ['org-1'] });
  });

  it('mirrors space roles onto user upserts', () => {
    const spacePayload = {
      metadata: { guid: 'space-1' },
      entity: {
        name: 'space-name',
        developers: ['user-dev'],
        managers: ['user-mgr'],
        auditors: ['user-aud'],
        supporters: ['user-sup'],
      },
    };
    const { ctx, upserts } = makeCtx();

    applyOrgSpaceRoles(spaceEntityType, [spacePayload], ctx);

    expect(upserts).toHaveLength(4);
    const byUser = new Map(upserts.map(u => [u.guid, u.row]));
    expect(byUser.get('user-dev')).toEqual({ [CfUserRoleParams.SPACES]: ['space-1'] });
    expect(byUser.get('user-mgr')).toEqual({ [CfUserRoleParams.MANAGED_SPACES]: ['space-1'] });
    expect(byUser.get('user-aud')).toEqual({ [CfUserRoleParams.AUDITED_SPACES]: ['space-1'] });
    expect(byUser.get('user-sup')).toEqual({ [CfUserRoleParams.SUPPORTED_SPACES]: ['space-1'] });
  });

  it('mirrors supporter role: user payload with supported_spaces surfaces as supporter', () => {
    const spacePayload = {
      metadata: { guid: 's-1' },
      entity: {
        name: 'my-space',
        supporters: ['user-supporter-1'],
      },
    };
    const { ctx, upserts } = makeCtx();

    applyOrgSpaceRoles(spaceEntityType, [spacePayload], ctx);

    expect(upserts).toHaveLength(1);
    expect(upserts[0].entityType).toBe(cfUserEntityType);
    expect(upserts[0].guid).toBe('user-supporter-1');
    expect(upserts[0].row).toEqual({ [CfUserRoleParams.SUPPORTED_SPACES]: ['s-1'] });
  });

  it('no-ops on unknown root entity type', () => {
    const { ctx, upserts } = makeCtx();
    applyOrgSpaceRoles('not-an-org-or-space', [{ metadata: { guid: 'x' }, entity: { managers: ['u'] } }], ctx);
    expect(upserts).toHaveLength(0);
  });

  it('skips parents missing a guid or body', () => {
    const { ctx, upserts } = makeCtx();
    applyOrgSpaceRoles(organizationEntityType, [
      null,
      { entity: { managers: ['u'] } }, // missing guid
      { metadata: { guid: 'org-2' } },  // missing body
    ], ctx);
    expect(upserts).toHaveLength(0);
  });

  it('ignores non-string user ids defensively', () => {
    const orgPayload = {
      metadata: { guid: 'org-1' },
      entity: {
        managers: ['user-1', 42, null, undefined],
      },
    };
    const { ctx, upserts } = makeCtx();
    applyOrgSpaceRoles(organizationEntityType, [orgPayload], ctx);
    expect(upserts).toHaveLength(1);
    expect(upserts[0].guid).toBe('user-1');
  });
});
