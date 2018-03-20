import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  CheckProjectExists,
  FetchBranchesForProject,
  FetchCommit,
  SetAppSourceDetails,
  SetDeployBranch,
  StoreCFSettings,
} from '../../../../../../store/actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../../../../../../store/actions/github.actions';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import {
  entityFactory,
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  githubRepoSchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { selectEntities } from '../../../../../../store/selectors/api.selectors';
import { GithubCommit, GithubRepo } from '../../../../../../store/types/github.types';
import { ApplicationService } from '../../../../application.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';

@Component({
  selector: 'app-github-tab',
  templateUrl: './github-tab.component.html',
  styleUrls: ['./github-tab.component.scss']
})
export class GithubTabComponent implements OnInit, OnDestroy {
  gitBranchEntityService: EntityService;
  gitCommitEntityService: EntityService;
  gitHubRepoEntityService: EntityService;

  deployAppSubscription: Subscription;
  stratosProject$: Observable<EnvVarStratosProject>;
  gitHubRepo$: Observable<GithubRepo>;
  commit$: Observable<GithubCommit>;
  isHead$: Observable<boolean>;
  initialised$: Observable<boolean>;
  private githubProjectEntityService: EntityService;

  ngOnDestroy(): void {
    if (this.deployAppSubscription) {
      this.deployAppSubscription.unsubscribe();
    }
  }

  constructor(
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory
  ) { }

  ngOnInit() {
    this.stratosProject$ = this.applicationService.applicationStratProject$.pipe(
      take(1),
      tap((stProject: EnvVarStratosProject) => {
        const projectName = stProject.deploySource.project;
        const commitId = stProject.deploySource.commit.trim();

        this.gitHubRepoEntityService = this.entityServiceFactory.create(
          githubRepoSchemaKey,
          entityFactory(githubRepoSchemaKey),
          projectName,
          new FetchGitHubRepoInfo(stProject),
          false
        );

        this.gitCommitEntityService = this.entityServiceFactory.create(
          githubCommitSchemaKey,
          entityFactory(githubCommitSchemaKey),
          commitId,
          new FetchCommit(commitId, projectName),
          false
        );

        const branchKey = `${projectName}-${stProject.deploySource.branch}`;
        this.gitBranchEntityService = this.entityServiceFactory.create(
          githubBranchesSchemaKey,
          entityFactory(githubBranchesSchemaKey),
          branchKey,
          new FetchBranchesForProject(projectName),
          false
        );

        this.gitHubRepo$ = this.gitHubRepoEntityService.waitForEntity$.pipe(
          map(p => p.entity && p.entity.entity)
        );

        this.commit$ = this.gitCommitEntityService.waitForEntity$.pipe(
          map(p => p.entity && p.entity.entity)
        );
        this.isHead$ = this.gitBranchEntityService.waitForEntity$.pipe(
          map(p => {
            return (
              p.entity.entity.commit.sha ===
              stProject.deploySource.commit.trim()
            );
          }),
          tap(p => (this.initialised$ = Observable.of(true)))
        );
      })
    );
  }

  deployApp(stratosProject: EnvVarStratosProject) {
    this.deployAppSubscription = Observable.combineLatest(
      this.applicationService.application$,
      this.store.select(selectEntities('space')),
      this.gitBranchEntityService.entityObs$
    )
      .pipe(
        take(1),
        tap(([app, spaces, branch]) => {
          // set CF data
          const spaceGuid = app.app.entity.space_guid;
          this.store.dispatch(
            new StoreCFSettings({
              cloudFoundry: app.app.entity.cfGuid,
              org: spaces[spaceGuid].entity.organization_guid,
              space: spaceGuid
            })
          );

          // set Project data
          this.store.dispatch(
            new CheckProjectExists(stratosProject.deploySource.project)
          );
          // Set Source type
          this.store.dispatch(
            new SetAppSourceDetails({
              name: 'Git',
              id: 'git',
              subType: 'github'
            })
          );
          // Set branch
          this.store.dispatch(new SetDeployBranch(branch.entity.entity.name));

          this.store.dispatch(
            new RouterNav({
              path: ['/applications/deploy'],
              query: { redeploy: true }
            })
          );
        })
      )
      .subscribe();
  }
}
