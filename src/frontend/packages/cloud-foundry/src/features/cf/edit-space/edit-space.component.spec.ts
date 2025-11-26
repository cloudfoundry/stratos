import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

import { TabNavService } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { EditSpaceComponent } from './edit-space.component';

describe('EditSpaceComponent', () => {
  let component: EditSpaceComponent;
  let fixture: ComponentFixture<EditSpaceComponent>;

  const mockActiveRoute = {
    cfGuid: 'test-cf-guid',
    orgGuid: 'test-org-guid',
    spaceGuid: 'test-space-guid'
  };

  const mockSpaceService = {
    cfGuid: 'test-cf-guid',
    orgGuid: 'test-org-guid',
    spaceGuid: 'test-space-guid',
    space$: of({
      entity: {
        entity: {
          name: 'test-space',
          allow_ssh: true,
          space_quota_definition_guid: null
        }
      }
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditSpaceComponent,
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateCFEntities(),
            ...generateStratosEntities(),
          ]
        },
        TabNavService,
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ]
    })
      .overrideComponent(EditSpaceComponent, {
        set: {
          providers: [
            { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
            { provide: CloudFoundrySpaceService, useValue: mockSpaceService }
          ]
        }
      })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
