import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '@stratosui/core';
import { getGitHubAPIURL, gitEntityCatalog, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { CATALOGUE_ENTITIES, entityCatalog, TestEntityCatalog } from '@stratosui/store';

import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { GitRegistrationComponent } from './git-registration.component';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';

describe('GitRegistrationComponent', () => {
  let component: GitRegistrationComponent;
  let fixture: ComponentFixture<GitRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GitRegistrationComponent ],
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        { 
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
            return [
              ...generateStratosEntities(),
              ...gitEntityCatalog.allGitEntities()
            ];
          }, multi: false 
        },
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
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GitRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
