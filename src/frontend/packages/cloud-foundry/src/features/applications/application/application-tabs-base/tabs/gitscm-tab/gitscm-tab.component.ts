import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { CFAppState } from '../../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { GitMeta } from '../../../../../../entity-action-builders/git-action-builder';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { GitSCMService, GitSCMType } from '../../../../../../shared/data-services/scm/scm.service';
import { GitBranch, GitCommit, GitRepo } from '../../../../../../store/types/git.types';
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
        const scm = this.scmService.getSCM(scmType as GitSCMType);

        const gitRepInfoMeta: GitMeta = { projectName: stProject.deploySource.project, scm };
        this.gitSCMRepoEntityService = cfEntityCatalog.gitRepo.store.getRepoInfo.getEntityService(gitRepInfoMeta)

        const gitMeta: GitMeta = { projectName: stProject.deploySource.project, scm, commitSha };
        const repoEntityID = `${scmType}-${projectName}`;
        const commitEntityID = `${repoEntityID}-${commitSha}`; // FIXME: Should come from action #4245
        this.gitCommitEntityService = cfEntityCatalog.gitCommit.store.getEntityService(commitEntityID, null, gitMeta)

        this.gitBranchEntityService = cfEntityCatalog.gitBranch.store.getEntityService(undefined, undefined, {
          scm,
          projectName: projectName,
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
