import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TailwindSnackBarService, TailwindSnackBarRef } from '@stratosui/core';
import {
  GitBranch,
  GitCommit,
  GitDataService,
  GithubCommitsSignalConfigService,
  GitMeta,
  GitRepo,
  GitResource,
  GitSCM,
  GitSCMService,
  GitSCMType,
  SCMIcon,
  GithubCommitAuthorComponent,
} from '@stratosui/git';
import { getUnixTime } from 'date-fns';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

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


  private readonly destroyRef = inject(DestroyRef);

  // The git lookups this tab reads, set once the project resolves (and, for
  // the commit and branch, once the repo does). Template state derives from
  // their signals, so a lookup that settles after the first render, or fails,
  // still reaches the view.
  private readonly repo = signal<GitResource<GitRepo> | undefined>(undefined);
  private readonly commitLookup = signal<GitResource<GitCommit> | undefined>(undefined);
  private readonly branchLookup = signal<GitResource<GitBranch> | undefined>(undefined);

  // undefined while the repo state is still resolving (before value/error).
  public readonly hasRepo = computed(() => {
    const repo = this.repo();
    return repo?.value() ? true : repo?.error() ? false : undefined;
  });
  public readonly isLoading$ = toObservable(computed(() => this.hasRepo() === undefined));

  public readonly gitSCMRepo = computed(() => this.repo()?.value() ?? null);
  // A failed commit or branch lookup leaves these null: the template leaves
  // the details out.
  public readonly commit = computed(() => this.commitLookup()?.value() ?? null);
  public readonly isHead = computed(() => {
    const branch = this.branchLookup()?.value();
    // strict: a resolved branch carries its head commit.
    return branch ? branch.commit!.sha === this.deployedCommitSha : null;
  });
  public readonly icon = signal<SCMIcon | undefined>(undefined);

  // Signal-native commit list config — undefined until the repo resolves.
  public readonly listConfig: WritableSignal<SignalListConfig<GitCommit> | undefined> = signal(undefined);

  private snackBarRef?: TailwindSnackBarRef<any>;

  // Context needed by the per-row Deploy / Compare actions, captured as the
  // lookups resolve so the action callbacks can read them synchronously.
  private scm!: GitSCM;
  private projectName = '';
  private branchName = '';
  private deployedCommitSha = '';
  private cfGuid = '';
  private orgGuid = '';
  private spaceGuid = '';
  private appGuid = '';

  // The Compare action is only offered for commits newer than the deployed
  // one (see the legacy createEnabled gating).
  private readonly deployedTime = computed(() => {
    const deployed = this.commit()?.commit;
    return deployed ? getUnixTime(new Date(deployed.author.date)) : 0;
  });

  public noContentFirstLine = 'Unable to fetch details';
  public noContentSecondLine: NoContentMessageLine = {
    text: 'This repository may be private or has been removed.'
  };
  public noContentOtherLines: NoContentMessageLine[] = [{
    text: 'Alternatively this may be due to a communication issue.'
  }];

  // Exposed for the SHA cell template's "(deployed)" marker.
  public isDeployedCommit = (c: GitCommit): boolean => this.signalConfig.isHighlighted(c);

  constructor() {
    // Once the repo resolves, look up the deployed commit and the branch head
    // and kick off the signal-native commit list.
    effect(() => {
      const repo = this.gitSCMRepo();
      if (repo && !untracked(this.listConfig)) {
        untracked(() => this.loadRepoDetails());
      }
    });

    effect(() => {
      const repo = this.repo();
      if (repo?.error()) {
        const errorMessage = repo.errorMessage();
        untracked(() => this.reportRepoError(errorMessage));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
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
    // Resolve the CF org/space/app guids the Deploy action needs to seed the
    // redeploy wizard.
    combineLatest([this.appService.waitForAppEntity$, this.appService.appSpace$]).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
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
    // load and STRATOS_PROJECT is parsed; on a direct load that is after
    // the first render.
    this.appService.applicationStratProject$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(stProject => {
      const { projectName, scm } = this.createBaseGitMeta(stProject);
      this.scm = scm;
      this.projectName = projectName;
      // strict: git-deploy STRATOS_PROJECT always carries project/branch/commit
      // (optional on the shared source type for docker/other deploy kinds).
      this.branchName = stProject.deploySource.branch!;
      this.deployedCommitSha = stProject.deploySource.commit!.trim();
      this.icon.set(scm.getIcon());
      // Read once and held: a failed lookup leaves the cache, so a second
      // read would start a new request instead of seeing this one.
      this.repo.set(this.gitData.getRepository(scm, projectName));
    });
  }

  private loadRepoDetails(): void {
    this.commitLookup.set(this.gitData.getCommit(this.scm, this.projectName, this.deployedCommitSha));
    // The branch head moves with every push, so it is read afresh each
    // time the tab opens rather than taken from an earlier visit's cache.
    this.branchLookup.set(this.gitData.getBranch(this.scm, this.projectName, this.branchName, { refresh: true }));

    this.signalConfig.initialize(this.scm, this.projectName, this.branchName, this.deployedCommitSha);
    void this.signalConfig.loadAll();
    this.listConfig.set(this.buildListConfig());
  }

  private reportRepoError(errorMessage: string): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    this.snackBarRef = this.snackBar.error(`Unable to fetch ${this.scm.getLabel()} project: ${errorMessage}`);
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
          if (!isDeployed && this.deployedTime() < getUnixTime(new Date(c.commit?.author?.date ?? 0))) {
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
    window.open(this.scm.getCompareCommitURL(this.gitSCMRepo()?.html_url ?? '', this.deployedCommitSha, commit.sha), '_blank');
  }
}
