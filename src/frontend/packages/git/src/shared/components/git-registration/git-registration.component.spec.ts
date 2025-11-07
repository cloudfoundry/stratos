import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '@stratosui/core';
import { getGitHubAPIURL, gitEntityCatalog, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { CATALOGUE_ENTITIES, entityCatalog, TestEntityCatalog } from '@stratosui/store';

import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { GitTestingModule } from '../../../git-testing.module';
import { GitRegistrationComponent } from './git-registration.component';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';

describe('GitRegistrationComponent', () => {
  let component: GitRegistrationComponent;
  let fixture: ComponentFixture<GitRegistrationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        GitTestingModule,
        GitRegistrationComponent,
      ],
      providers: [
        EntityServiceFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                subtype: 'github'
              },
              queryParams: {}
            }
          }
        }
      ]
    }),
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GitRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
