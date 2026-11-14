import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfCurrentUserRolesDataService } from '../../../../services/cf-current-user-roles-data.service';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CreateApplicationStep1Component } from './create-application-step1.component';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep1Component;
  let fixture: ComponentFixture<CreateApplicationStep1Component>;

  async function setup(endpointGuid: string | null) {
    await TestBed.configureTestingModule({
      imports: [
        CreateApplicationStep1Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
        {
          provide: ActivatedRoute,
          useValue: {
            root: {
              snapshot: {
                queryParams: { endpointGuid },
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationStep1Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('should be created', async () => {
    await setup(null);
    expect(component).toBeTruthy();
  });

  it('does not lock the CF dropdown when not scoped to an endpoint', async () => {
    await setup(null);
    expect(component.endpointScoped).toBe(false);
  });

  it('pre-selects and locks the CF dropdown when scoped to an endpoint', async () => {
    await setup('cf-endpoint-guid');
    expect(component.endpointScoped).toBe(true);
    expect(component.cfOrgSpaceService.cf.select()).toBe('cf-endpoint-guid');
  });

  describe('spaces', () => {
    const level = <T>(select: T, list: unknown[] = []) => ({ select: signal(select), list: signal(list), loading: signal(false) });

    async function setupSpaces(developerIn: string[] | 'all') {
      const orgSpace = {
        cf: level<string | null>('cf-1', [{ guid: 'cf-1', name: 'cf' }]),
        org: level<string | null>('org-1', [{ guid: 'org-1', name: 'org' }]),
        space: level<string | null>(null, [{ guid: 'sp-1', name: 'one' }, { guid: 'sp-2', name: 'two' }]),
      };
      await TestBed.configureTestingModule({
        imports: [CreateApplicationStep1Component],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          ...STORE_TEST_PROVIDERS,
          importProvidersFrom(generateCfBaseTestModulesNoShared()),
          { provide: CfOrgSpaceDataService, useValue: orgSpace },
          { provide: CfCurrentUserRolesDataService, useValue: { spacesWithRoleInOrg: () => signal(developerIn) } },
          { provide: ActivatedRoute, useValue: { root: { snapshot: { queryParams: {} } } } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(CreateApplicationStep1Component);
      component = fixture.componentInstance;
      await fixture.whenStable();
      return orgSpace;
    }

    it('lists only the spaces the user develops in', async () => {
      await setupSpaces(['sp-2']);
      expect(component.spaces().map(sp => sp.guid)).toEqual(['sp-2']);
    });

    it('lists every space while the roles are not known', async () => {
      await setupSpaces('all');
      expect(component.spaces().map(sp => sp.guid)).toEqual(['sp-1', 'sp-2']);
    });

    it('has no spaces when none can be developed in', async () => {
      await setupSpaces([]);
      expect(component.hasSpaces()).toBe(false);
    });
  });
});
