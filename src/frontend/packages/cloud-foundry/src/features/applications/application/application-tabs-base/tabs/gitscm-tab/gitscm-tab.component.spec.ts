import { DatePipe } from '@angular/common';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import {
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory,
  entityCatalog,
  type TestEntityCatalog,
  generateStratosEntities,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestApplicationServiceProvider } from '@test-framework/cf';
import { TailwindSnackBarService } from '@stratosui/core';
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { generateASEntities } from '@stratosui/cf-autoscaler';

import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { GitSCMTabComponent } from './gitscm-tab.component';

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    // Initialize entity catalog before test
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();

    await TestBed.configureTestingModule({
      imports: [
        GitSCMTabComponent,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
                ...generateASEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        EntityCatalogHelper,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        TailwindSnackBarService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        DatePipe,
        GitSCMService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(GitSCMTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
