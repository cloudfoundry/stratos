import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, WritableSignal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TailwindSnackBarService, TailwindSnackBarRef } from '@stratosui/core';
import {
  GitCommit,
  GitDataService,
  GithubCommitsSignalConfigService,
  GitMeta,
  GitRepo,
  GitSCM,
  GitSCMService,
  GitSCMType,
  SCMIcon,
  GithubCommitAuthorComponent,
} from '@stratosui/git';
import { getUnixTime } from 'date-fns';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
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

import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
} from '../../../../../../../../core/src/shared/components/signal-list/signal-list.component';
import {
  SignalListCellTemplateDirective,
} from '../../../../../../../../core/src/shared/components/signal-list/signal-list-cell-template.directive';
import {
  NoContentMessageLine,
} from '../../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { CfDeployAppDataService } from '../../../../../../services/domain-data/cf-deploy-app-data.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';
import { LoadingPageComponent } from '../../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { TileGridComponent } from '../../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { MetadataItemComponent } from '../../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
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
    SignalListComponent,
    SignalListCellTemplateDirective,
    NoContentMessageComponent,
    GithubCommitAuthorComponent,
    TruncatePipe
  ],
  providers: [
    DatePipe,
    GithubCommitsSignalConfigService,
  ],
})
export class GitSCMTabComponent implements OnInit, OnDestroy {
  data = inject(AppDetailDataService);
  private appService = inject(ApplicationService);
  private snackBar = inject(TailwindSnackBarService);
  private scmService = inject(GitSCMService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private deployData = inject(CfDeployAppDataService);
  private gitData = inject(GitDataService);
  private readonly signalConfig = inject(GithubCommitsSignalConfigService);


  // undefined while the repo state is still resolving (before value/error).
  public hasRepo$!: Observable<boolean | undefined>;
  public isLoading$!: Observable<boolean>;

  public gitSCMRepo$!: Observable<GitRepo>;
  public commit$!: Observable<GitCommit>;
  public isHead$!: Observable<boolean>;

  // Signal-native commit list config — undefined until the repo + branch
  // resolve (the commits load happens in the same block).
  public readonly listConfig: WritableSignal<SignalListConfig<GitCommit> | undefined> = signal(undefined);

  private gitSCMRepoErrorSub!: Subscription;
  private snackBarRef?: TailwindSnackBarRef<any>;

  // Context needed by the per-row Deploy / Compare actions, captured as the
  // observables resolve so the action callbacks can read them synchronously.
  private scm!: GitSCM;
  private projectName = '';
  private branchName = '';
  private deployedCommitSha = '';
  private deployedTime = 0;
  private repoHtmlUrl = '';
  private cfGuid = '';
  private orgGuid = '';
  private spaceGuid = '';
  private appGuid = '';

  public noContentFirstLine = 'Unable to fetch details';
  public noContentSecondLine: NoContentMessageLine = {
    text: 'This repository may be private or has been removed.'
  };
  public noContentOtherLines: NoContentMessageLine[] = [{
    text: 'Alternatively this may be due to a communication issue.'
  }];
  public icon$!: Observable<SCMIcon>;

  // Exposed for the SHA cell template's "(deployed)" marker.
  public isDeployedCommit = (c: GitCommit): boolean => this.signalConfig.isHighlighted(c);

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

    // strict: this tab only renders for git-deployed apps, whose STRATOS_PROJECT
    // deploySource always carries project/branch/commit (optional on the shared
    // source type because docker/other deploy kinds omit them).
    return { projectName: stProject.deploySource.project!, scm };
  }

  ngOnInit() {
    // Show the loading spinner until applicationStratProject$ resolves.
    // The fields built inside the subscribe overwrite this once the
    // project (and its repo) become available.
    this.isLoading$ = of(true);

    // Resolve the CF org/space/app guids the Deploy action needs to seed the
    // redeploy wizard.
    combineLatest([this.appService.waitForAppEntity$, this.appService.appSpace$]).pipe(
      take(1),
    ).subscribe(([app, space]) => {
      // strict: cfGuid is stamped on every loaded app entity (optional on IApp
      // only because the raw CF payload omits it before Stratos decorates it).
      this.cfGuid = app.entity.entity.cfGuid!;
      this.spaceGuid = app.entity.entity.space_guid;
      // strict: appSpace$ has resolved by the time waitForAppEntity$ emits an
      // app on a detail page; the legacy code read space.orgGuid unguarded.
      this.orgGuid = space!.orgGuid;
      this.appGuid = app.entity.metadata.guid;
    });

    // applicationStratProject$ is filtered to non-null by the facade
    // (application.service.ts:197-199), so it suspends until env vars
    // load and STRATOS_PROJECT is parsed. take(1) gives us a one-shot
    // value with the same timing as the legacy observable.
    this.appService.applicationStratProject$.pipe(take(1)).subscribe(stProject => {
      const baseGitMeta = this.createBaseGitMeta(stProject);
      const coreInfo$: Observable<[EnvVarStratosProject, GitMeta]> = of(
        [stProject, baseGitMeta] as [EnvVarStratosProject, GitMeta]
      );

      this.scm = baseGitMeta.scm;
      // strict: git-deploy STRATOS_PROJECT always carries project/branch/commit
      // (optional on the shared source type for docker/other deploy kinds).
      this.projectName = stProject.deploySource.project!;
      this.branchName = stProject.deploySource.branch!;
      this.deployedCommitSha = stProject.deploySource.commit!.trim();
      this.icon$ = of(baseGitMeta.scm.getIcon());

      this.hasRepo$ = this.gitData.getRepository(baseGitMeta.scm, baseGitMeta.projectName).state$.pipe(
        map(state => state.value ? true : state.error ? false : undefined),
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
        filter(hasRepo => !!hasRepo),
        switchMap(() => coreInfo$)
      );

      this.gitSCMRepo$ = blockedOnRepo$.pipe(
        switchMap(([, meta]) => this.gitData.getRepository(meta.scm, meta.projectName).waitForValue$)
      );

      // Once the repo resolves, capture its URL (for Compare links) and kick
      // off the signal-native commit list.
      this.gitSCMRepo$.pipe(take(1)).subscribe(repo => {
        this.repoHtmlUrl = repo.html_url;
        this.signalConfig.initialize(this.scm, this.projectName, this.branchName, this.deployedCommitSha);
        void this.signalConfig.loadAll();
        this.listConfig.set(this.buildListConfig());
      });

      this.gitSCMRepoErrorSub = this.hasRepo$.pipe(
        filter(hasRepo => hasRepo === false),
        switchMap(() => coreInfo$),
        switchMap(([, meta]) => this.gitData.getRepository(meta.scm, meta.projectName).state$),
        map(state => state.errorMessage),
        distinctUntilChanged(),
        withLatestFrom(coreInfo$)
      ).subscribe(([errorMessage, [, meta]]) => {
        if (this.snackBarRef) {
          this.snackBarRef.dismiss();
        }
        this.snackBarRef = this.snackBar.error(`Unable to fetch ${meta.scm.getLabel()} project: ${errorMessage}`);
      });

      this.commit$ = blockedOnRepo$.pipe(
        // strict: git-deploy deploySource always carries commit/branch.
        switchMap(([project, meta]) =>
          this.gitData.getCommit(meta.scm, meta.projectName, project.deploySource.commit!.trim()).waitForValue$
        )
      );
      // Capture the deployed commit's timestamp — the Compare action is only
      // offered for commits newer than the deployed one (see the legacy
      // createEnabled gating).
      this.commit$.pipe(take(1)).subscribe(deployedCommit => {
        // strict: getCommit resolves the full commit detail before emitting.
        this.deployedTime = getUnixTime(new Date(deployedCommit.commit!.author.date));
      });
      this.isHead$ = blockedOnRepo$.pipe(
        // strict: git-deploy deploySource always carries branch.
        switchMap(([project, meta]) =>
          this.gitData.getBranch(meta.scm, meta.projectName, project.deploySource.branch!).waitForValue$
        ),
        withLatestFrom(blockedOnRepo$),
        // strict: a resolved branch carries its head commit; deploySource.commit
        // is present for git-deployed apps.
        map(([branch, [project]]) => branch.commit!.sha === project.deploySource.commit!.trim()),
      );
    });
  }

  private buildListConfig(): SignalListConfig<GitCommit> {
    const columns: SignalListColumn<GitCommit>[] = [
      {
        header: 'Message', key: 'message',
        kind: 'text',
        sortField: (c: GitCommit) => (c.commit?.message ?? '').toLowerCase(),
        render: (c: GitCommit) => c.commit?.message ?? '',
        widthHint: '40%',
      },
      {
        header: 'SHA', key: 'sha',
        kind: 'template', templateName: 'sha',
        sortField: (c: GitCommit) => c.sha,
        render: (c: GitCommit) => c.sha.substring(0, 8),
      },
      {
        header: 'Author', key: 'author',
        kind: 'template', templateName: 'author',
        sortField: (c: GitCommit) => (c.commit?.author?.name ?? '').toLowerCase(),
        render: (c: GitCommit) => c.commit?.author?.name ?? '',
      },
      {
        header: 'Date', key: 'date',
        kind: 'text',
        sortField: (c: GitCommit) => new Date(c.commit?.author?.date ?? 0).getTime(),
        render: (c: GitCommit) => this.datePipe.transform(c.commit?.author?.date, 'medium') ?? '',
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        render: () => '',
        actions: (c: GitCommit) => {
          const items = [
            { label: 'Deploy', icon: 'rocket_launch', invoke: () => this.redeploy(c) },
          ];
          // Compare is offered only for commits newer than the deployed one
          // (GitHub renders "no change" otherwise) and never for the deployed
          // commit itself.
          const isDeployed = c.sha === this.deployedCommitSha;
          if (!isDeployed && this.deployedTime < getUnixTime(new Date(c.commit?.author?.date ?? 0))) {
            items.push({ label: 'Compare', icon: 'compare_arrows', invoke: () => this.compare(c) });
          }
          return items;
        },
      },
    ];

    return {
      pagedItems: this.signalConfig.view.pagedItems,
      totalFilteredResults: this.signalConfig.view.totalFilteredResults,
      totalPages: this.signalConfig.view.totalPages,
      pageIndex: this.signalConfig.pageIndex,
      pageSize: this.signalConfig.pageSize,
      isAnyLoading: this.signalConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      pageSizeOptions: [10, 25, 50, 100],
      columns,
      getRowKey: this.signalConfig.getRowKey,
      emptyMessage: 'There are no commits',
      loadingMessage: 'Loading commits…',
      sort: this.signalConfig.sort,
    };
  }

  private redeploy(commit: GitCommit): void {
    // Seed the deploy wizard's signal-native state so the redeploy page lands
    // on step 3 with everything pre-populated.
    this.deployData.setCfDetails({
      cloudFoundry: this.cfGuid,
      org: this.orgGuid,
      space: this.spaceGuid,
    });
    this.deployData.checkProjectExists(this.scm, this.projectName);
    this.deployData.setSourceType({
      name: this.scm.getLabel(),
      id: this.scm.getType(),
      group: 'gitscm',
      endpointGuid: this.scm.endpointGuid,
    });
    this.deployData.setDeployBranch(this.branchName);
    this.deployData.setDeployCommit(commit.sha);

    this.router.navigate(['/applications/deploy'], { queryParams: { appGuid: this.appGuid } });
  }

  private compare(commit: GitCommit): void {
    window.open(this.scm.getCompareCommitURL(this.repoHtmlUrl, this.deployedCommitSha, commit.sha), '_blank');
  }
}
