import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  APIResource,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { generateCFEntities } from '../../cf-entity-generator';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';

/**
 * Helper to build an APIResource<IOrganization> with spaces for testing.
 */
function makeOrg(
  orgGuid: string,
  orgName: string,
  cfGuid: string,
  spaces: { guid: string; name: string }[]
): APIResource<IOrganization> {
  return {
    metadata: { guid: orgGuid, created_at: '', updated_at: '', url: '' },
    entity: {
      name: orgName,
      cfGuid,
      guid: orgGuid,
      spaces: spaces.map(s => ({
        metadata: { guid: s.guid, created_at: '', updated_at: '', url: '' },
        entity: {
          name: s.name,
          guid: s.guid,
          organization_guid: orgGuid,
          allow_ssh: false,
          organization_url: '',
          developers_url: '',
          managers_url: '',
          auditors_url: '',
          apps_url: '',
          routes_url: '',
          domains_url: '',
          service_instances_url: '',
          app_events_url: '',
          security_groups_url: '',
          staging_security_groups_url: '',
        } as ISpace,
      })) as APIResource<ISpace>[],
    } as IOrganization,
  };
}

/**
 * Replicate the createSpace() mapping logic for isolated unit testing.
 * This mirrors the observable pipeline in CfOrgSpaceDataService.createSpace()
 * so we can verify the transformation without full NgRx store setup.
 */
function spaceListMapper(selectedOrgGuid: string | null, orgs: APIResource<IOrganization>[]): ISpace[] {
  if (selectedOrgGuid) {
    const selectedOrg = orgs.find(org => org.metadata.guid === selectedOrgGuid);
    if (selectedOrg?.entity?.spaces) {
      return (selectedOrg.entity.spaces as APIResource<ISpace>[]).map(space => {
        const entity = { ...space.entity };
        entity.guid = space.metadata.guid;
        return entity;
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }
  const seen = new Set<string>();
  const allSpaces: ISpace[] = [];
  for (const org of orgs) {
    if (org.entity?.spaces) {
      for (const space of (org.entity.spaces as APIResource<ISpace>[])) {
        if (!seen.has(space.metadata.guid)) {
          seen.add(space.metadata.guid);
          const entity = { ...space.entity };
          entity.guid = space.metadata.guid;
          entity.name = `${space.entity.name} (${org.entity.name})`;
          allSpaces.push(entity);
        }
      }
    }
  }
  return allSpaces.sort((a, b) => a.name.localeCompare(b.name));
}

describe('CfOrgSpaceDataService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        CfOrgSpaceDataService,
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    expect(service).toBeTruthy();
  });
});

describe('createSpace() mapping logic', () => {

  const orgs = [
    makeOrg('org-1', 'us-east-prod', 'cf-1', [
      { guid: 'space-1a', name: 'development' },
      { guid: 'space-1b', name: 'production' },
    ]),
    makeOrg('org-2', 'eu-central-prod', 'cf-1', [
      { guid: 'space-2a', name: 'development' },
      { guid: 'space-2b', name: 'staging' },
    ]),
  ];

  describe('when an org is selected', () => {
    it('returns spaces from only that org with plain names', () => {
      const result = spaceListMapper('org-1', orgs);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toEqual(['development', 'production']);
    });

    it('sets guid on each space entity', () => {
      const result = spaceListMapper('org-1', orgs);
      expect(result[0].guid).toBe('space-1a');
      expect(result[1].guid).toBe('space-1b');
    });

    it('sorts spaces alphabetically', () => {
      const reversed = [
        makeOrg('org-x', 'test-org', 'cf-1', [
          { guid: 's3', name: 'zebra' },
          { guid: 's1', name: 'alpha' },
          { guid: 's2', name: 'middle' },
        ]),
      ];
      const result = spaceListMapper('org-x', reversed);
      expect(result.map(s => s.name)).toEqual(['alpha', 'middle', 'zebra']);
    });

    it('returns empty array when org has no spaces', () => {
      const noSpaces = [makeOrg('org-empty', 'empty-org', 'cf-1', [])];
      const result = spaceListMapper('org-empty', noSpaces);
      expect(result).toEqual([]);
    });

    it('returns empty array when org guid not found', () => {
      const result = spaceListMapper('nonexistent', orgs);
      expect(result).toEqual([]);
    });
  });

  describe('when org is "All" (no selection)', () => {
    it('aggregates spaces from all orgs', () => {
      const result = spaceListMapper(null, orgs);
      expect(result).toHaveLength(4);
    });

    it('labels spaces as "space (org)" for disambiguation', () => {
      const result = spaceListMapper(null, orgs);
      const names = result.map(s => s.name);
      expect(names).toContain('development (eu-central-prod)');
      expect(names).toContain('development (us-east-prod)');
      expect(names).toContain('production (us-east-prod)');
      expect(names).toContain('staging (eu-central-prod)');
    });

    it('sorts alphabetically (space name leads sort)', () => {
      const result = spaceListMapper(null, orgs);
      const names = result.map(s => s.name);
      expect(names).toEqual([
        'development (eu-central-prod)',
        'development (us-east-prod)',
        'production (us-east-prod)',
        'staging (eu-central-prod)',
      ]);
    });

    it('preserves correct GUIDs on disambiguated spaces', () => {
      const result = spaceListMapper(null, orgs);
      const devEu = result.find(s => s.name === 'development (eu-central-prod)');
      const devUs = result.find(s => s.name === 'development (us-east-prod)');
      expect(devEu!.guid).toBe('space-2a');
      expect(devUs!.guid).toBe('space-1a');
    });

    it('deduplicates spaces by GUID', () => {
      const withDupe = [
        makeOrg('org-a', 'org-a', 'cf-1', [
          { guid: 'shared-space', name: 'shared' },
        ]),
        makeOrg('org-b', 'org-b', 'cf-1', [
          { guid: 'shared-space', name: 'shared' },
        ]),
      ];
      const result = spaceListMapper(null, withDupe);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('shared (org-a)');
    });

    it('skips orgs with no spaces property', () => {
      const mixed: APIResource<IOrganization>[] = [
        makeOrg('org-1', 'has-spaces', 'cf-1', [
          { guid: 'sp-1', name: 'dev' },
        ]),
        {
          metadata: { guid: 'org-2', created_at: '', updated_at: '', url: '' },
          entity: { name: 'no-spaces' } as IOrganization,
        },
      ];
      const result = spaceListMapper(null, mixed);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('dev (has-spaces)');
    });

    it('returns empty array when no orgs have spaces', () => {
      const empty = [
        makeOrg('org-1', 'empty1', 'cf-1', []),
        makeOrg('org-2', 'empty2', 'cf-1', []),
      ];
      const result = spaceListMapper(null, empty);
      expect(result).toEqual([]);
    });

    it('treats empty string org selection as "All"', () => {
      const result = spaceListMapper('', orgs);
      expect(result).toHaveLength(4);
      expect(result[0].name).toContain('(');
    });
  });
});
