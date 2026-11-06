
import { Component, ComponentRef, ViewChild, ViewContainerRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';

import { StepOnNextFunction } from '@stratosui/core';
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

  // Stable BehaviorSubjects back the public Observable fields. The wrapper
  // component is recreated on every onEnter, so the underlying stream
  // changes each time — but we keep the field references stable and
  // forward values into these subjects. This preserves any subscription
  // the parent template's async pipe may have already taken against
  // `validate`, which under OnPush + zoneless CD is not guaranteed to be
  // re-read after the parent has first bound it.
  private selectedCommitSubject = new BehaviorSubject<GitCommit | null>(null);
  private useLatestHeadSubject = new BehaviorSubject<boolean>(false);
  private validateSubject = new BehaviorSubject<boolean>(false);

  readonly selectedCommit$: Observable<GitCommit | null> = this.selectedCommitSubject.asObservable();
  readonly validate: Observable<boolean> = this.validateSubject.asObservable();

  // The step is valid when the user has picked a specific commit OR opted to
  // deploy the latest commit on the branch (HEAD) without pinning one.
  static isStepValid(useLatestHead: boolean, commit: GitCommit | null): boolean {
    return useLatestHead || !!commit;
  }

  @ViewChild('target', { read: ViewContainerRef, static: true })
  target!: ViewContainerRef;
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  private wrapperSub?: Subscription;

  onLeave = () => {
    this.wrapperSub?.unsubscribe();
    this.wrapperSub = undefined;
    this.selectedCommitSubject.next(null);
    this.useLatestHeadSubject.next(false);
    this.validateSubject.next(false);
    this.wrapperRef.destroy();
    this.target.clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target.createComponent(CommitListWrapperComponent);
    const wrapper = this.wrapperRef.instance as CommitListWrapperComponent;
    this.wrapperSub?.unsubscribe();
    // Validity is driven by either a pinned commit OR the deploy-latest-HEAD
    // toggle — combine both wrapper streams so the step settles correctly when
    // the user flips the toggle on/off.
    this.wrapperSub = combineLatest([wrapper.selectedCommit$, wrapper.useLatestHead$])
      .subscribe(([commit, useLatestHead]) => {
        this.selectedCommitSubject.next(commit ?? null);
        this.useLatestHeadSubject.next(useLatestHead);
        this.validateSubject.next(DeployApplicationStep21Component.isStepValid(useLatestHead, commit ?? null));
      });
  };

  onNext: StepOnNextFunction = () => {
    // Latest-HEAD wins: send an empty commit so the backend deploys whatever
    // the branch currently points at (it skips the `git reset` when Commit is
    // empty). Otherwise pin the selected commit's SHA.
    if (this.useLatestHeadSubject.getValue()) {
      this.deployData.setDeployCommit('');
    } else {
      const commit = this.selectedCommitSubject.getValue();
      if (commit) {
        this.deployData.setDeployCommit(commit.sha);
      }
    }
    return observableOf({ success: true });
  };
}
