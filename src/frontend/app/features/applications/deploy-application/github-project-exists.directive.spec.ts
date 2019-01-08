import { HttpModule } from '@angular/http';
import { Store } from '@ngrx/store';
import { inject, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { AppState } from '../../../store/app-state';
import { GitSCMService } from '../../../shared/data-services/scm/scm.service';
import { GithubProjectExistsDirective } from './github-project-exists.directive';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../core/github.helpers';


describe('GithubProjectExistsDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        HttpModule
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    });
  });
  it('should create an instance',  inject([Store, GitSCMService], (store: Store<AppState>, scmService: GitSCMService) => {
    const directive = new GithubProjectExistsDirective(store, scmService);
    expect(directive).toBeTruthy();
  }));
});
