import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { TailwindSnackBarService, TailwindSnackBarRef } from '@stratosui/core';
import { GitCommit, gitEntityCatalog, GitMeta, GitRepo, GitSCMService, GitSCMType, SCMIcon, GithubCommitAuthorComponent } from '@stratosui/git';
import { Observable, Subscription, of } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';

import { ApplicationService } from '../../../../application.service';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  NoContentMessageLine,
} from '../../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import {
  GithubCommitsListConfigServiceAppTab,
} from '../../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-app-tab.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';
import { LoadingPageComponent } from '../../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { TileGridComponent } from '../../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { MetadataItemComponent } from '../../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { NoContentMessageComponent } from '../../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { TruncatePipe } from '../../../../../../../../core/src/core/truncate.pipe';

@Component({
  selector: 'app-gitscm-tab',
  templateUrl: './gitscm-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LoadingPageComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    MetadataItemComponent,
    ListComponent,
    NoContentMessageComponent,
    GithubCommitAuthorComponent,
    TruncatePipe
  ],
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useFactory: () => new GithubCommitsListConfigServiceAppTab(),
      deps: []
    }
  ],
})
export class GitSCMTabComponent implements OnInit, OnDestroy {
  data = inject(AppDetailDataService);
  private appService = inject(ApplicationService);
  private snackBar = inject(TailwindSnackBarService);
  private scmService = inject(GitSCMService);


  public hasRepo$!: Observable<boolean>;
  public isLoading$!: Observable<boolean>;

  public gitSCMRepo$!: Observable<GitRepo>;
  public commit$!: Observable<GitCommit>;
  public isHead$!: Observable<boolean>;

  private gitSCMRepoErrorSub!: Subscription;
  private snackBarRef: TailwindSnackBarRef<any>;

  public noContentFirstLine = 'Unable to fetch details';
  public noContentSecondLine: NoContentMessageLine = {
    text: 'This repository may be private or has been removed.'
  };
  public noContentOtherLines: NoContentMessageLine[] = [{
    text: 'Alternatively this may be due to a communication issue.'
  }];
  public icon$!: Observable<SCMIcon>;

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    if (this.gitSCMRepoErrorSub) {
      this.gitSCMRepoErrorSub.unsubscribe();
    }
  }

  private createBaseGitMeta(stProject: EnvVarStratosProject): GitMeta {
    // Fallback to type if scm is not set (legacy support)
    const scmType = stProject.deploySource.scm || stProject.deploySource.type;
    const scm = this.scmService.getSCM(scmType as GitSCMType, stProject.deploySource.endpointGuid);

    return { projectName: stProject.deploySource.project, scm };
  }

  ngOnInit() {
    // Show the loading spinner until applicationStratProject$ resolves.
    // The fields built inside the subscribe overwrite this once the
    // project (and its repo) become available.
    this.isLoading$ = of(true);

    // applicationStratProject$ is filtered to non-null by the facade
    // (application.service.ts:197-199), so it suspends until env vars
    // load and STRATOS_PROJECT is parsed. take(1) gives us a one-shot
    // value with the same timing as the legacy observable.
    this.appService.applicationStratProject$.pipe(take(1)).subscribe(stProject => {
      const baseGitMeta = this.createBaseGitMeta(stProject);
      const coreInfo$: Observable<[EnvVarStratosProject, GitMeta]> = of(
        [stProject, baseGitMeta] as [EnvVarStratosProject, GitMeta]
      );

      this.icon$ = of(baseGitMeta.scm.getIcon());

      this.hasRepo$ = gitEntityCatalog.repo.store.getRepoInfo
        .getEntityService(baseGitMeta).entityObs$.pipe(
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
        map(([, meta]) => gitEntityCatalog.repo.store.getRepoInfo.getEntityService(meta)),
        switchMap(repoService => repoService.waitForEntity$),
        map(p => p.entity)
      );

      this.gitSCMRepoErrorSub = this.hasRepo$.pipe(
        filter(hasRepo => hasRepo === false),
        switchMap(() => coreInfo$),
        switchMap(([, meta]) => gitEntityCatalog.repo.store.getRepoInfo.getEntityService(meta).entityMonitor.entityRequest$),
        map(request => request.message),
        distinctUntilChanged(),
        withLatestFrom(coreInfo$)
      ).subscribe(([errorMessage, [, meta]]) => {
        if (this.snackBarRef) {
          this.snackBarRef.dismiss();
        }
        this.snackBarRef = this.snackBar.error(`Unable to fetch ${meta.scm.getLabel()} project: ${errorMessage}`);
      });

      this.commit$ = blockedOnRepo$.pipe(
        map(([project, meta]) => gitEntityCatalog.commit.store.getEntityService(null, null, {
          ...meta,
          commitSha: project.deploySource.commit.trim()
        })),
        switchMap(commitService => commitService.waitForEntity$),
        map(p => p.entity)
      );
      this.isHead$ = blockedOnRepo$.pipe(
        map(([project, meta]) => gitEntityCatalog.branch.store.getEntityService(undefined, undefined, {
          ...meta,
          branchName: project.deploySource.branch
        })),
        switchMap(branchService => branchService.waitForEntity$),
        withLatestFrom(blockedOnRepo$),
        map(([p, [project]]) => p.entity.commit.sha === project.deploySource.commit.trim()),
      );
    });
  }
}
