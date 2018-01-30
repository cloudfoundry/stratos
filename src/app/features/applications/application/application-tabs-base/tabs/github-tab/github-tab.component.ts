import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../../../application.service';
import { tap, map } from 'rxjs/operators';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { AppEnvVarsState } from '../../../../../../store/types/app-metadata.types';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { FetchGitHubRepoInfo } from '../../../../../../store/actions/github.actions';
import { GithubRepo, GITHUB_REPO_ENTITY_KEY, GithubCommit } from '../../../../../../store/types/github.types';
import { GITHUB_BRANCHES_ENTITY_KEY, GITHUB_COMMIT_ENTITY_KEY } from '../../../../../../store/types/deploy-application.types';
import { FetchCommit } from '../../../../../../store/actions/deploy-applications.actions';
@Component({
  selector: 'app-github-tab',
  templateUrl: './github-tab.component.html',
  styleUrls: ['./github-tab.component.scss']
})
export class GithubTabComponent implements OnInit, OnDestroy {
  stratosProject$: Observable<EnvVarStratosProject>;
  gitHubRepo$: Observable<GithubRepo>;
  commit$: Observable<GithubCommit>;

  ngOnDestroy(): void {
  }

  constructor(private applicationService: ApplicationService, private store: Store<AppState>) { }

  ngOnInit() {
    this.stratosProject$ = this.applicationService.application$.pipe(
      map(p => JSON.parse(p.app.entity.environment_json.STRATOS_PROJECT)),
      tap((stProject: EnvVarStratosProject) => {
        if (!this.gitHubRepo$) {
          const commitId = stProject.deploySource.commit.trim();
          this.store.dispatch(new FetchGitHubRepoInfo(stProject));
          this.gitHubRepo$ = this.store.select(selectEntity(GITHUB_REPO_ENTITY_KEY, stProject.deploySource.project));
          const url = `https://api.github.com/repos/${stProject.deploySource.project}/commits/${commitId}`
          this.store.dispatch(new FetchCommit({sha: commitId, url: url }));
          this.commit$ = this.store.select(selectEntity(GITHUB_COMMIT_ENTITY_KEY, commitId));

        }
      })
    );
  }

}
