import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  GitCommit,
  GithubCommitAuthorComponent,
  GithubCommitsSignalConfigService,
  GitSCMService,
  GitSCMType,
} from '@stratosui/git';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
} from '../../../../../../../core/src/shared/components/signal-list/signal-list.component';
import {
  SignalListCellTemplateDirective,
} from '../../../../../../../core/src/shared/components/signal-list/signal-list-cell-template.directive';
import { CfDeployAppDataService } from '../../../../../../../cloud-foundry/src/services/domain-data/cf-deploy-app-data.service';

@Component({
  selector: 'app-commit-list-wrapper',
  templateUrl: './commit-list-wrapper.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SignalListComponent,
    SignalListCellTemplateDirective,
    GithubCommitAuthorComponent,
  ],
  providers: [
    DatePipe,
    GithubCommitsSignalConfigService,
  ],
})
export class CommitListWrapperComponent {
  private readonly signalConfig = inject(GithubCommitsSignalConfigService);
  private readonly scmService = inject(GitSCMService);
  private readonly deployData = inject(CfDeployAppDataService);
  private readonly datePipe = inject(DatePipe);

  public readonly listConfig: WritableSignal<SignalListConfig<GitCommit> | undefined> = signal(undefined);

  // Branch the commits are listed from — shown in the deploy-latest-HEAD note.
  public readonly branchName: WritableSignal<string> = signal('');

  // "Deploy the latest commit on the branch" — when on, no specific commit is
  // pinned; the deploy sends an empty SHA and CF deploys whatever HEAD points
  // at. Off (default) preserves the pick-a-commit behaviour.
  public readonly useLatestHead: WritableSignal<boolean> = signal(false);
  readonly useLatestHead$: Observable<boolean> = toObservable(this.useLatestHead);

  // The chosen commit (or null) — derived from the radio selection signal.
  // deploy-application-step2-1 subscribes to this to drive step validity and
  // seed the deploy payload.
  readonly selectedCommit$: Observable<GitCommit | null> = toObservable(
    computed(() => this.signalConfig.selectedCommit() ?? null)
  );

  // Toggle handler for the deploy-latest-HEAD checkbox. Clears the radio
  // selection while on (so a stale pin isn't carried) and restores the
  // newest-commit default when toggled back off.
  setUseLatestHead(value: boolean): void {
    this.useLatestHead.set(value);
    if (value) {
      this.signalConfig.selectedKey.set(null);
    } else {
      this.signalConfig.selectFirst();
    }
  }

  constructor() {
    // Resolve the git source (project + branch) from the deploy wizard's
    // application-source signal, mirroring the legacy deploy list-config.
    toObservable(this.deployData.applicationSource).pipe(
      map(appSource => (appSource?.type?.id === 'github' || appSource?.type?.id === 'gitlab') ? {
        scm: appSource.type.id as GitSCMType,
        accessToken: appSource.gitDetails?.accessToken,
        projectName: appSource.gitDetails?.projectName,
        sha: appSource.gitDetails?.branch?.name,
        endpointGuid: appSource.gitDetails?.endpointGuid,
      } : null),
      filter(fetchDetails => !!fetchDetails && !!fetchDetails.projectName && !!fetchDetails.sha),
      take(1),
    ).subscribe(fetchDetails => {
      const scm = this.scmService.getSCM(fetchDetails.scm, fetchDetails.endpointGuid, fetchDetails.accessToken);
      this.branchName.set(fetchDetails.sha);
      this.signalConfig.initialize(scm, fetchDetails.projectName, fetchDetails.sha);
      this.listConfig.set(this.buildListConfig());
      // Auto-select the first (newest) commit once the list loads so the step
      // starts valid, matching the legacy picker.
      void this.signalConfig.loadAll().then(() => this.signalConfig.selectFirst());
    });
  }

  private buildListConfig(): SignalListConfig<GitCommit> {
    const columns: SignalListColumn<GitCommit>[] = [
      {
        header: '', key: 'radio',
        kind: 'radio',
        radio: { selectedKey: this.signalConfig.selectedKey },
        render: () => '',
        widthHint: '3rem',
      },
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
}
