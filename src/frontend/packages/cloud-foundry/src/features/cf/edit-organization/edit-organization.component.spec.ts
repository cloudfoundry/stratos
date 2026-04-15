import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { EditOrganizationComponent } from "./edit-organization.component";

describe('EditOrganizationComponent', () => {
  let component: EditOrganizationComponent;
  let fixture: ComponentFixture<EditOrganizationComponent>;

  const mockActiveRoute = {
    cfGuid: 'test-cf-guid',
    orgGuid: 'test-org-guid',
    spaceGuid: 'test-space-guid'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditOrganizationComponent,
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
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        TabNavService,
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
