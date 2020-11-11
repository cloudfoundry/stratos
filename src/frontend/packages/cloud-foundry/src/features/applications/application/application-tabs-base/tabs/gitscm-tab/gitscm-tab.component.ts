import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { GitBranch, GitCommit, gitEntityCatalog, GitMeta, GitRepo, GitSCMService, GitSCMType } from '@stratosui/git';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { CFAppState } from '../../../../../../cf-app-state';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
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
        applicationService: ApplicationService) => {
        return new GithubCommitsListConfigServiceAppTab(store, datePipe, scmService, applicationService);
      },
      deps: [Store, DatePipe, GitSCMService, ApplicationService]
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
    private snackBar: MatSnackBar,
    private scmService: GitSCMService
  ) { }

  ngOnInit() {
    this.stratosProject$ = this.applicationService.applicationStratProject$.pipe(
      take(1),
      tap((stProject: EnvVarStratosProject) => {
        const projectName = stProject.deploySource.project;
        const commitSha = stProject.deploySource.commit.trim();

        // Fallback to type if scm is not set (legacy support)
        const scmType = stProject.deploySource.scm || stProject.deploySource.type;
        const scm = this.scmService.getSCM(scmType as GitSCMType, stProject.deploySource.endpoint);

        const gitRepInfoMeta: GitMeta = { projectName: stProject.deploySource.project, scm };
        this.gitSCMRepoEntityService = gitEntityCatalog.repo.store.getRepoInfo.getEntityService(gitRepInfoMeta);

        const gitMeta: GitMeta = { projectName: stProject.deploySource.project, scm, commitSha };
        const repoEntityID = `${scmType}-${projectName}`;
        const commitEntityID = `${repoEntityID}-${commitSha}`; // FIXME: Should come from action #4245
        this.gitCommitEntityService = gitEntityCatalog.commit.store.getEntityService(commitEntityID, null, gitMeta);

        this.gitBranchEntityService = gitEntityCatalog.branch.store.getEntityService(undefined, undefined, {
          scm,
          projectName,
          branchName: stProject.deploySource.branch
        });


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
