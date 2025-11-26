
import {
  Component,
  inject,
  type ComponentRef,
  ViewContainerRef,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
import type { GeneralEntityAppState } from '@stratosui/store';

import type { StepOnNextFunction } from '@stratosui/core';
import type { GitCommit } from '@stratosui/git';
import { SetDeployCommit } from '../../../../actions/deploy-applications.actions';
import type { CFAppState } from '../../../../cf-app-state';
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

  private readonly store = inject(Store<GeneralEntityAppState>);

  validate!: Observable<boolean>;
  selectedCommit$!: Observable<GitCommit>;

  readonly target = viewChild.required('target', { read: ViewContainerRef });
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  constructor() {
  }

  onLeave = () => {
    this.wrapperRef.destroy();
    this.target().clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target().createComponent(CommitListWrapperComponent);
    const wrapper = this.wrapperRef.instance as CommitListWrapperComponent;
    this.selectedCommit$ = wrapper.selectedCommit$;
    this.validate = this.selectedCommit$.pipe(
      map(selectedCommit => !!selectedCommit)
    );
  };

  onNext: StepOnNextFunction = () => {
    return this.selectedCommit$.pipe(
      first(),
      tap(commit => {
        this.store.dispatch(new SetDeployCommit(commit.sha));
      }),
      map(() => ({ success: true }))
    );
  };
}
