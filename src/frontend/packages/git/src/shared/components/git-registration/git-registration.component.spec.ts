import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '@stratosui/core';
import { getGitHubAPIURL, gitEntityCatalog, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { GitRegistrationComponent } from './git-registration.component';

describe('GitRegistrationComponent', () => {
  let component: GitRegistrationComponent;
  let fixture: ComponentFixture<GitRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GitRegistrationComponent ],
      imports: [
        ...BaseTestModulesNoShared,
        createBasicStoreModule(),
        SharedModule,
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        { provide: CATALOGUE_ENTITIES, useFactory: () => gitEntityCatalog.allGitEntities(), multi: false },
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
