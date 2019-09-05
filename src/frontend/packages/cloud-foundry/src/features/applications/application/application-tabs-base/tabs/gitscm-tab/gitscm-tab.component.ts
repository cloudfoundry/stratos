import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import {
  FetchBranchesForProject,
  FetchCommit,
} from '../../../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../../../../../../../../cloud-foundry/src/actions/github.actions';
import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { GitCommit, GitRepo } from '../../../../../../../../cloud-foundry/src/store/types/git.types';
import { EntityService } from '../../../../../../../../core/src/core/entity-service';
import { EntityServiceFactory } from '../../../../../../../../core/src/core/entity-service-factory.service';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../../../core/src/shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { GitSCMService, GitSCMType } from '../../../../../../../../core/src/shared/data-services/scm/scm.service';
import { ApplicationService } from '../../../../application.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';

@Component({
  selector: 'app-gitscm-tab',
  templateUrl: './gitscm-tab.component.html',
  styleUrls: ['./gitscm-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<CFAppState>,
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
    private store: Store<CFAppState>,
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
        const repoEntityID = `${scmType}-${projectName}`;
        const commitEntityID = `${repoEntityID}-${commitId}`;

        this.gitSCMRepoEntityService = this.entityServiceFactory.create(
          repoEntityID,
          new FetchGitHubRepoInfo(stProject),
          false
        );

        this.gitCommitEntityService = this.entityServiceFactory.create(
          commitEntityID,
          new FetchCommit(scm, commitId, projectName),
          false
        );

        const branchID = `${scmType}-${projectName}-${stProject.deploySource.branch}`;
        this.gitBranchEntityService = this.entityServiceFactory.create(
          branchID,
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
