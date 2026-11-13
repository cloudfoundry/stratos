
import { Component, ComponentRef, ViewContainerRef, ChangeDetectionStrategy, computed, inject, signal, viewChild } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

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

  // Set from the commit list wrapper, which is recreated on every onEnter.
  private readonly selectedCommit = signal<GitCommit | null>(null);
  private readonly useLatestHead = signal(false);
  // The step is valid when the user has picked a specific commit OR opted to
  // deploy the latest commit on the branch (HEAD) without pinning one.
  static isStepValid(useLatestHead: boolean, commit: GitCommit | null): boolean {
    return useLatestHead || !!commit;
  }

  readonly validate = computed(() => DeployApplicationStep21Component.isStepValid(this.useLatestHead(), this.selectedCommit()));

  readonly target = viewChild.required('target', { read: ViewContainerRef });
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  private wrapperSub?: Subscription;

  onLeave = () => {
    this.wrapperSub?.unsubscribe();
    this.wrapperSub = undefined;
    this.selectedCommit.set(null);
    this.useLatestHead.set(false);
    this.wrapperRef.destroy();
    this.target().clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target().createComponent(CommitListWrapperComponent);
    const wrapper = this.wrapperRef.instance as CommitListWrapperComponent;
    this.wrapperSub?.unsubscribe();
    // Validity is driven by either a pinned commit OR the deploy-latest-HEAD
    // toggle — combine both wrapper streams so the step settles correctly when
    // the user flips the toggle on/off.
    this.wrapperSub = combineLatest([wrapper.selectedCommit$, wrapper.useLatestHead$])
      .subscribe(([commit, useLatestHead]) => {
        this.selectedCommit.set(commit ?? null);
        this.useLatestHead.set(useLatestHead);
      });
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
