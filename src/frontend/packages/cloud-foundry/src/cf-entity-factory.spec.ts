import { describe, it, expect } from 'vitest';
import { ORG_ROLE_DEFS, SPACE_ROLE_DEFS } from './roles/role-registry';
import { orgRoleSchemaParams, spaceRoleSchemaParams } from './cf-entity-factory';

describe('cf-entity-factory — role schema params parity', () => {
  it('spaceRoleSchemaParams carries a CFUserSchema array for every space role def', () => {
    for (const def of SPACE_ROLE_DEFS) {
      expect(
        (spaceRoleSchemaParams as Record<string, unknown>)[def.stratos],
        `missing key ${def.stratos}`
      ).toBeDefined();
    }
  });

  it('orgRoleSchemaParams carries a CFUserSchema array for every org role def', () => {
    for (const def of ORG_ROLE_DEFS) {
      expect(
        (orgRoleSchemaParams as Record<string, unknown>)[def.stratos],
        `missing key ${def.stratos}`
      ).toBeDefined();
    }
  });

  it('spaceRoleSchemaParams has exactly as many keys as SPACE_ROLE_DEFS', () => {
    expect(Object.keys(spaceRoleSchemaParams)).toHaveLength(SPACE_ROLE_DEFS.length);
  });

  it('orgRoleSchemaParams has exactly as many keys as ORG_ROLE_DEFS', () => {
    expect(Object.keys(orgRoleSchemaParams)).toHaveLength(ORG_ROLE_DEFS.length);
  });
});
