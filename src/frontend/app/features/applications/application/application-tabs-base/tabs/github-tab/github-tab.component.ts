import { DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { GITHUB_API_URL } from '../../../../../../core/github.helpers';
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
  githubRepoErrorSub: Subscription;
  commit$: Observable<GithubCommit>;
  isHead$: Observable<boolean>;
  initialised$: Observable<boolean>;
  private githubProjectEntityService: EntityService;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  ngOnDestroy(): void {
    if (this.deployAppSubscription) {
      this.deployAppSubscription.unsubscribe();
    }
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    if (this.githubRepoErrorSub) {
      this.githubRepoErrorSub.unsubscribe();
    }
  }

  constructor(
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private snackBar: MatSnackBar,
    @Inject(GITHUB_API_URL) private gitHubURL: string
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
          new FetchCommit(commitId, projectName, this.gitHubURL),
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

        this.githubRepoErrorSub = this.gitHubRepoEntityService.entityMonitor.entityRequest$.pipe(
          filter(request => !!request.error),
          map(request => request.message),
          distinctUntilChanged(),
        ).subscribe(errorMessage => {
          if (this.snackBarRef) {
            this.snackBarRef.dismiss();
          }
          this.snackBarRef = this.snackBar.open(`Unable to fetch Github project: ${errorMessage}`, 'Dismiss');
        });

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
          tap(p => (this.initialised$ = observableOf(true)))
        );
      })
    );
  }

}
