
import { Component, ComponentRef, ViewChild, ViewContainerRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@stratosui/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';

import { StepOnNextFunction } from '@stratosui/core';
import { GitCommit } from '@stratosui/git';
import { SetDeployCommit } from '../../../../actions/deploy-applications.actions';
import { CFAppState } from '../../../../cf-app-state';
import { CommitListWrapperComponent } from './commit-list-wrapper/commit-list-wrapper.component';

@Component({
  selector: 'app-deploy-application-step2-1',
  templateUrl: './deploy-application-step2-1.component.html',
  styleUrls: ['./deploy-application-step2-1.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class DeployApplicationStep21Component {
  private store = inject<Store<CFAppState>>(Store);

  // Stable BehaviorSubjects back the public Observable fields. The wrapper
  // component is recreated on every onEnter, so the underlying stream
  // changes each time — but we keep the field references stable and
  // forward values into these subjects. This preserves any subscription
  // the parent template's async pipe may have already taken against
  // `validate`, which under OnPush + zoneless CD is not guaranteed to be
  // re-read after the parent has first bound it.
  private selectedCommitSubject = new BehaviorSubject<GitCommit | null>(null);
  private validateSubject = new BehaviorSubject<boolean>(false);

  readonly selectedCommit$: Observable<GitCommit | null> = this.selectedCommitSubject.asObservable();
  readonly validate: Observable<boolean> = this.validateSubject.asObservable();

  @ViewChild('target', { read: ViewContainerRef, static: true })
  target!: ViewContainerRef;
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  private wrapperSub?: Subscription;

  onLeave = () => {
    this.wrapperSub?.unsubscribe();
    this.wrapperSub = undefined;
    this.selectedCommitSubject.next(null);
    this.validateSubject.next(false);
    this.wrapperRef.destroy();
    this.target.clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target.createComponent(CommitListWrapperComponent);
    const wrapper = this.wrapperRef.instance as CommitListWrapperComponent;
    this.wrapperSub?.unsubscribe();
    this.wrapperSub = wrapper.selectedCommit$.subscribe(commit => {
      this.selectedCommitSubject.next(commit ?? null);
      this.validateSubject.next(!!commit);
    });
  };

  onNext: StepOnNextFunction = () => {
    const commit = this.selectedCommitSubject.getValue();
    if (commit) {
      this.store.dispatch(new SetDeployCommit(commit.sha));
    }
    return observableOf({ success: true });
  };
}
