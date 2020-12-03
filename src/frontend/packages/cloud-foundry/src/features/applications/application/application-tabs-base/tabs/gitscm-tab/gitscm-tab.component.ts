import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { GitCommit, gitEntityCatalog, GitMeta, GitRepo, GitSCMService, GitSCMType, SCMIcon } from '@stratosui/git';
import { Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  NoContentMessageLine,
} from '../../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
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
  ],
})
export class GitSCMTabComponent implements OnInit, OnDestroy {

  public hasRepo$: Observable<boolean>;
  public isLoading$: Observable<boolean>;

  public gitSCMRepo$: Observable<GitRepo>;
  public commit$: Observable<GitCommit>;
  public isHead$: Observable<boolean>;

  private gitSCMRepoErrorSub: Subscription;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  public noContentFirstLine = 'Unable to fetch details';
  public noContentSecondLine: NoContentMessageLine = {
    text: 'This repository may be private or has been removed.'
  };
  public noContentOtherLines: NoContentMessageLine[] = [{
    text: 'Alternatively this may be due to a communication issue.'
  }];
  public icon$: Observable<SCMIcon>;

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    if (this.gitSCMRepoErrorSub) {
      this.gitSCMRepoErrorSub.unsubscribe();
    }
  }

  constructor(
    public appService: ApplicationService,
    private snackBar: MatSnackBar,
    private scmService: GitSCMService
  ) { }

  private createBaseGitMeta(stProject: EnvVarStratosProject): GitMeta {
    // Fallback to type if scm is not set (legacy support)
    const scmType = stProject.deploySource.scm || stProject.deploySource.type;
    const scm = this.scmService.getSCM(scmType as GitSCMType, stProject.deploySource.endpointGuid);

    return { projectName: stProject.deploySource.project, scm };
  }

  ngOnInit() {
    const coreInfo$: Observable<[EnvVarStratosProject, GitMeta]> = this.appService.applicationStratProject$.pipe(
      first(),
      map(stProject => [stProject, this.createBaseGitMeta(stProject)])
    );

    this.icon$ = this.appService.applicationStratProject$.pipe(
      first(),
      map((stProject: EnvVarStratosProject) => {
        const meta: GitMeta = this.createBaseGitMeta(stProject);
        return meta.scm.getIcon();
      })
    );

    this.hasRepo$ = this.appService.applicationStratProject$.pipe(
      first(),
      switchMap((stProject: EnvVarStratosProject) => {
        const gitRepInfoMeta: GitMeta = this.createBaseGitMeta(stProject);
        return gitEntityCatalog.repo.store.getRepoInfo.getEntityService(gitRepInfoMeta).entityObs$;
      }),
      map(entity => entity.entity ? true : entity.entityRequestInfo.error ? false : undefined),
      startWith(undefined),
      publishReplay(1),
      refCount()
    );

    this.isLoading$ = this.hasRepo$.pipe(
      filter(hasRepo => hasRepo !== undefined),
      map(() => false),
      startWith(true)
    );

    const blockedOnRepo$: Observable<[EnvVarStratosProject, GitMeta]> = this.hasRepo$.pipe(
      filter(hasRepo => hasRepo),
      switchMap(() => coreInfo$)
    );

    this.gitSCMRepo$ = blockedOnRepo$.pipe(
      map(([, baseGitMeta]) => gitEntityCatalog.repo.store.getRepoInfo.getEntityService(baseGitMeta)),
      switchMap(repoService => repoService.waitForEntity$),
      map(p => p.entity)
    );

    this.gitSCMRepoErrorSub = this.hasRepo$.pipe(
      filter(hasRepo => hasRepo === false),
      switchMap(() => coreInfo$),
      switchMap(([, baseGitMeta]) => gitEntityCatalog.repo.store.getRepoInfo.getEntityService(baseGitMeta).entityMonitor.entityRequest$),
      map(request => request.message),
      distinctUntilChanged(),
      withLatestFrom(coreInfo$)
    ).subscribe(([errorMessage, [, baseGitMeta]]) => {
      if (this.snackBarRef) {
        this.snackBarRef.dismiss();
      }
      this.snackBarRef = this.snackBar.open(`Unable to fetch ${baseGitMeta.scm.getLabel()} project: ${errorMessage}`, 'Dismiss');
    });

    this.commit$ = blockedOnRepo$.pipe(
      map(([stProject, baseGitMeta]) => gitEntityCatalog.commit.store.getEntityService(null, null, {
        ...baseGitMeta,
        commitSha: stProject.deploySource.commit.trim()
      })),
      switchMap(commitService => commitService.waitForEntity$),
      map(p => p.entity)
    );
    this.isHead$ = blockedOnRepo$.pipe(
      map(([stProject, baseGitMeta]) => gitEntityCatalog.branch.store.getEntityService(undefined, undefined, {
        ...baseGitMeta,
        branchName: stProject.deploySource.branch
      })),
      switchMap(branchService => branchService.waitForEntity$),
      withLatestFrom(blockedOnRepo$),
      map(([p, [stProject]]) => p.entity.commit.sha === stProject.deploySource.commit.trim()),
    );
  }
}
