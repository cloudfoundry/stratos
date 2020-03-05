import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import { GitCommit, GitRepo } from '../../../../../../../../cloud-foundry/src/store/types/git.types';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../../../core/src/shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { GitSCMService, GitSCMType } from '../../../../../../../../core/src/shared/data-services/scm/scm.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { FetchGitHubRepoInfo } from '../../../../../../actions/github.actions';
import { CFAppState } from '../../../../../../cf-app-state';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from '../../../../../../cf-entity-types';
import { GitBranch } from '../../../../../../store/types/github.types';
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

  gitBranchEntityService: EntityService<GitBranch>;
  gitCommitEntityService: EntityService<GitCommit>;
  gitSCMRepoEntityService: EntityService<GitRepo>;

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

        const gitRepoEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, gitRepoEntityType);
        const getRepoActionBuilder = gitRepoEntity.actionOrchestrator.getActionBuilder('getRepoInfo');
        const getRepoAction = getRepoActionBuilder(stProject) as FetchGitHubRepoInfo;
        this.gitSCMRepoEntityService = this.entityServiceFactory.create(
          repoEntityID,
          getRepoAction
        );

        this.gitCommitEntityService = this.entityServiceFactory.create(
          {
            endpointType: CF_ENDPOINT_TYPE,
            entityType: gitCommitEntityType,
            actionMetadata: { projectName: stProject.deploySource.project, scm, commitId },
            entityGuid: commitEntityID,
          }
        );

        const branchID = `${scmType}-${projectName}-${stProject.deploySource.branch}`;
        const gitBranchesEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, gitBranchesEntityType);
        const fetchBranchesActionBuilder = gitBranchesEntity.actionOrchestrator.getActionBuilder('get');
        this.gitBranchEntityService = this.entityServiceFactory.create(
          branchID,
          fetchBranchesActionBuilder(branchID, null, { projectName, scm })
        );

        this.gitSCMRepo$ = this.gitSCMRepoEntityService.waitForEntity$.pipe(
          map(p => p.entity && p.entity)
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
          map(p => p.entity)
        );

        this.isHead$ = this.gitBranchEntityService.waitForEntity$.pipe(
          map(p => {
            return (
              p.entity.commit.sha ===
              stProject.deploySource.commit.trim()
            );
          }),
          tap(p => (this.initialised$ = observableOf(true)))
        );
      })
    );
  }

}
