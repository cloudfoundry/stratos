import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, ActivatedRoute } from '@angular/router';

import {
  PaginationMonitorFactory,
  EntityMonitorFactory,
  EntityServiceFactory,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '@stratosui/core';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CreateApplicationComponent } from './create-application.component';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';

describe('CreateApplicationComponent', () => {
  let component: CreateApplicationComponent;
  let fixture: ComponentFixture<CreateApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        CreateApplicationComponent
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
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        CfOrgSpaceDataService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        EntityServiceFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(CreateApplicationComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
