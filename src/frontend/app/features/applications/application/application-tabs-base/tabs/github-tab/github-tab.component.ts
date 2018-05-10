import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { FetchBranchesForProject, FetchCommit } from '../../../../../../store/actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../../../../../../store/actions/github.actions';
import { AppState } from '../../../../../../store/app-state';
import {
  entityFactory,
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  githubRepoSchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { GithubCommit, GithubRepo } from '../../../../../../store/types/github.types';
import { ApplicationService } from '../../../../application.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';

@Component({
  selector: 'app-github-tab',
  templateUrl: './github-tab.component.html',
  styleUrls: ['./github-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        datePipe: DatePipe,
        applicationService: ApplicationService,
        entityServiceFactory: EntityServiceFactory) => {
        return new GithubCommitsListConfigServiceAppTab(store, datePipe, applicationService, entityServiceFactory);
      },
      deps: [Store, DatePipe, ApplicationService, EntityServiceFactory]
    }
  ]
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
        const commitEntityKey = projectName + '-' + commitId;

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
          commitEntityKey,
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

}
