import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SetDeployCommit } from '../../../../store/actions/deploy-applications.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { GitCommit } from '../../../../store/types/git.types';
import { CommitListWrapperComponent } from './commit-list-wrapper/commit-list-wrapper.component';

@Component({
  selector: 'app-deploy-application-step2-1',
  templateUrl: './deploy-application-step2-1.component.html',
  styleUrls: ['./deploy-application-step2-1.component.scss'],
  entryComponents: [
    CommitListWrapperComponent
  ],
})
export class DeployApplicationStep21Component {

  validate: Observable<boolean>;
  selectedCommit$: Observable<APIResource<GitCommit>>;

  @ViewChild('target', { read: ViewContainerRef })
  target: ViewContainerRef;
  wrapperFactory: ComponentFactory<CommitListWrapperComponent>;
  wrapperRef: ComponentRef<CommitListWrapperComponent>;

  constructor(
    private store: Store<AppState>,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(CommitListWrapperComponent);
  }

  onLeave = () => {
    this.wrapperRef.destroy();
    this.target.clear();
  }

  onEnter = () => {
    // Wrap the list component in another component. This means it's recreated every time to include changes in the github repo
    this.wrapperRef = this.target.createComponent(this.wrapperFactory);
    const wrapper = <CommitListWrapperComponent>this.wrapperRef.instance;
    this.selectedCommit$ = wrapper.selectedCommit$;
    this.validate = this.selectedCommit$.pipe(
      map(selectedCommit => !!selectedCommit)
    );
  }

  onNext: StepOnNextFunction = () => {
    return this.selectedCommit$.pipe(
      first(),
      tap(commit => {
        this.store.dispatch(new SetDeployCommit(commit.entity.sha));
      }),
      map(() => ({ success: true }))
    );
  }
}
