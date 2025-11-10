
import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  ViewChild,
  ViewContainerRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

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

  validate!: Observable<boolean>;
  selectedCommit$!: Observable<GitCommit>;

  @ViewChild('target', { read: ViewContainerRef, static: true })
  target!: ViewContainerRef;
  wrapperFactory: ComponentFactory<CommitListWrapperComponent>;
  wrapperRef!: ComponentRef<CommitListWrapperComponent>;

  constructor(
    private store: Store<CFAppState>,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(CommitListWrapperComponent);
  }

  onLeave = () => {
    this.wrapperRef.destroy();
    this.target.clear();
  };

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target.createComponent(this.wrapperFactory);
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
