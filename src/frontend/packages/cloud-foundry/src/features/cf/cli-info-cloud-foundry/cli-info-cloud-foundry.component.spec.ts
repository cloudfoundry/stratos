import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { TabNavService, CoreModule } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { CliInfoCloudFoundryComponent } from "./cli-info-cloud-foundry.component";

describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  const mockActiveRoute = {
    cfGuid: 'test-guid',
    orgGuid: 'org-guid',
    spaceGuid: 'space-guid'
  };

  const mockEndpointService = {
    endpoint$: of({
      entity: {
        guid: 'test-guid',
        name: 'Test Endpoint',
        api_endpoint: { Host: 'api.example.com' },
        user: { name: 'testuser' }
      }
    })
  };

  const mockOrgService = {
    org$: of({
      entity: {
        entity: {
          name: 'test-org',
          guid: 'org-guid'
        },
        metadata: {
          guid: 'org-guid'
        }
      }
    })
  };

  const mockSpaceService = {
    space$: of({
      entity: {
        entity: {
          name: 'test-space',
          guid: 'space-guid'
        },
        metadata: {
          guid: 'space-guid'
        }
      }
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CliInfoCloudFoundryComponent,
        CliInfoComponent,
        CliCommandComponent,
        CfUserPermissionDirective,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        TabNavService,
      ]
    })
      .overrideComponent(CliInfoCloudFoundryComponent, {
        set: {
          providers: [
            { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
            { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
            { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
            { provide: CloudFoundrySpaceService, useValue: mockSpaceService }
          ]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoCloudFoundryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
