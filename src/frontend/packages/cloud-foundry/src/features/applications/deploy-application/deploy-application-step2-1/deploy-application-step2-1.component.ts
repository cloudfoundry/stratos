
import { Component, ComponentRef, ViewContainerRef, ChangeDetectionStrategy, computed, inject, signal, viewChild } from '@angular/core';

import { StepOnNextResult } from '@stratosui/core';
import { GitCommit } from '@stratosui/git';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { CommitListWrapperComponent } from './commit-list-wrapper/commit-list-wrapper.component';

@Component({
  selector: 'app-deploy-application-step2-1',
  templateUrl: './deploy-application-step2-1.component.html',
  host: { class: 'app-host-flex-1' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class DeployApplicationStep21Component {
  private deployData = inject(CfDeployAppDataService);

  // The commit list wrapper, which is recreated on every onEnter.
  private readonly wrapper = signal<CommitListWrapperComponent | undefined>(undefined);
  private readonly selectedCommit = computed<GitCommit | null>(() => this.wrapper()?.selectedCommit() ?? null);
  private readonly useLatestHead = computed(() => !!this.wrapper()?.useLatestHead());
  // The step is valid when the user has picked a specific commit OR opted to
  // deploy the latest commit on the branch (HEAD) without pinning one.
  static isStepValid(useLatestHead: boolean, commit: GitCommit | null): boolean {
    return useLatestHead || !!commit;
  }

  readonly validate = computed(() => DeployApplicationStep21Component.isStepValid(this.useLatestHead(), this.selectedCommit()));

  readonly target = viewChild.required('target', { read: ViewContainerRef });
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  onLeave = () => {
    this.wrapper.set(undefined);
    this.wrapperRef.destroy();
    this.target().clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target().createComponent(CommitListWrapperComponent);
    // Validity is driven by either a pinned commit OR the deploy-latest-HEAD
    // toggle, both read from the wrapper.
    this.wrapper.set(this.wrapperRef.instance);
  };

  async onNext(): Promise<StepOnNextResult> {
    // Latest-HEAD wins: send an empty commit so the backend deploys whatever
    // the branch currently points at (it skips the `git reset` when Commit is
    // empty). Otherwise pin the selected commit's SHA.
    if (this.useLatestHead()) {
      this.deployData.setDeployCommit('');
    } else {
      const commit = this.selectedCommit();
      if (commit) {
        this.deployData.setDeployCommit(commit.sha);
      }
    }
    return { success: true };
  }
}
