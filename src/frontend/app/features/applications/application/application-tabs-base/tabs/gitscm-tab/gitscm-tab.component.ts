import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { GitSCMService } from '../../../../../../shared/data-services/scm/scm.service';
import { FetchBranchesForProject, FetchCommit } from '../../../../../../store/actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../../../../../../store/actions/github.actions';
import { AppState } from '../../../../../../store/app-state';
import {
  entityFactory,
  gitBranchesSchemaKey,
  gitCommitSchemaKey,
  gitRepoSchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { GitCommit, GitRepo } from '../../../../../../store/types/git.types';
import { ApplicationService } from '../../../../application.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';
import { GitSCMType } from './../../../../../../shared/data-services/scm/scm.service';


@Component({
  selector: 'app-gitscm-tab',
  templateUrl: './gitscm-tab.component.html',
  styleUrls: ['./gitscm-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        datePipe: DatePipe,
        scmService: GitSCMService,
        applicationService: ApplicationService,
        entityServiceFactory: EntityServiceFactory) => {
        return new GithubCommitsListConfigServiceAppTab(store, datePipe, scmService, applicationService, entityServiceFactory);
      },
      deps: [Store, DatePipe, GitSCMService, ApplicationService, EntityServiceFactory]
    }
  ]
})
export class GitSCMTabComponent implements OnInit, OnDestroy {

  gitBranchEntityService: EntityService;
  gitCommitEntityService: EntityService;
  gitSCMRepoEntityService: EntityService;

  deployAppSubscription: Subscription;
  stratosProject$: Observable<EnvVarStratosProject>;
  gitSCMRepo$: Observable<GitRepo>;
  gitSCMRepoErrorSub: Subscription;
  commit$: Observable<GitCommit>;
  isHead$: Observable<boolean>;
  initialised$: Observable<boolean>;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  ngOnDestroy(): void {
    if (this.deployAppSubscription) {
      this.deployAppSubscription.unsubscribe();
    }
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    if (this.gitSCMRepoErrorSub) {
      this.gitSCMRepoErrorSub.unsubscribe();
    }
  }

  constructor(
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private snackBar: MatSnackBar,
    private scmService: GitSCMService
  ) { }

  ngOnInit() {
    this.stratosProject$ = this.applicationService.applicationStratProject$.pipe(
      take(1),
      tap((stProject: EnvVarStratosProject) => {
        const projectName = stProject.deploySource.project;
        const commitId = stProject.deploySource.commit.trim();

        // Fallback to type if scm is not set (legacy support)
        const scmType = stProject.deploySource.scm || stProject.deploySource.type;
        const scm = this.scmService.getSCM(scmType as GitSCMType);

        // Ensure the SCM type is included in the key
        const repoEntityKey = `${scmType}-${projectName}`;
        const commitEntityKey = `${repoEntityKey}-${commitId}`;

        this.gitSCMRepoEntityService = this.entityServiceFactory.create(
          gitRepoSchemaKey,
          entityFactory(gitRepoSchemaKey),
          repoEntityKey,
          new FetchGitHubRepoInfo(stProject),
          false
        );

        this.gitCommitEntityService = this.entityServiceFactory.create(
          gitCommitSchemaKey,
          entityFactory(gitCommitSchemaKey),
          commitEntityKey,
          new FetchCommit(scm, commitId, projectName),
          false
        );

        const branchKey = `${scmType}-${projectName}-${stProject.deploySource.branch}`;
        this.gitBranchEntityService = this.entityServiceFactory.create(
          gitBranchesSchemaKey,
          entityFactory(gitBranchesSchemaKey),
          branchKey,
          new FetchBranchesForProject(scm, projectName),
          false
        );

        this.gitSCMRepo$ = this.gitSCMRepoEntityService.waitForEntity$.pipe(
          map(p => p.entity && p.entity.entity)
        );

        this.gitSCMRepoErrorSub = this.gitSCMRepoEntityService.entityMonitor.entityRequest$.pipe(
          filter(request => !!request.error),
          map(request => request.message),
          distinctUntilChanged(),
        ).subscribe(errorMessage => {
          if (this.snackBarRef) {
            this.snackBarRef.dismiss();
          }
          this.snackBarRef = this.snackBar.open(`Unable to fetch ${scm.getLabel()} project: ${errorMessage}`, 'Dismiss');
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
