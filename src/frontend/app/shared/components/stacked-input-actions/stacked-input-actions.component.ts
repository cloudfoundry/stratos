import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../core/utils.service';
import {
  StackedInputActionComponent,
  StackedInputActionResult,
  StackedInputActionUpdate,
} from './stacked-input-action/stacked-input-action.component';



export interface StackedInputActionsState {
  key: string;
  result: StackedInputActionResult;
  message?: string;
}

export interface StackedInputActionsUpdate { values: string[]; valid: boolean; }

@Component({
  selector: 'app-stacked-input-actions',
  templateUrl: './stacked-input-actions.component.html',
  styleUrls: ['./stacked-input-actions.component.scss'],
  entryComponents: [StackedInputActionComponent]
})
export class StackedInputActionsComponent implements OnInit, OnDestroy {

  @Input() state$: Observable<StackedInputActionsState[]>;
  @Output() update = new EventEmitter<StackedInputActionsUpdate>();


  @ViewChild('inputs', { read: ViewContainerRef })
  inputs: ViewContainerRef;

  private wrapperFactory: ComponentFactory<StackedInputActionComponent>;
  // private wrapperRefs: ComponentRef<StackedInputActionComponent>[];
  private components: {
    [key: number]: {
      stateSubject: Subject<StackedInputActionsState>,
      component: StackedInputActionComponent
    }
  } = {};
  private valueState: { [key: number]: StackedInputActionUpdate } = {};
  private subs: Subscription[] = [];

  // private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private cd: ChangeDetectorRef,
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(StackedInputActionComponent);
  }

  add() {
    const component = this.inputs.createComponent(this.wrapperFactory);

    // this.wrapperRefs.push(component);
    const index = this.inputs.length - 1; // this.wrapperRefs.length - 1;
    const stackedAction = component.instance;
    this.subs.push(stackedAction.remove.subscribe(() => {
      this.remove(index);
      delete this.valueState[index];
      this.emitValues();
    }));
    // stackedAction.result;
    this.subs.push(stackedAction.update.subscribe((update: StackedInputActionUpdate) => {
      this.valueState[index] = update;
      this.emitValues();
    }));

    const state = new BehaviorSubject<StackedInputActionsState>(null);

    stackedAction.state$ = state.asObservable();

    this.components[index] = {
      stateSubject: state,
      component: stackedAction
    };
    // state.next({
    //   key: '1',
    //   result: StackedInputActionResult.FAILED,
    //   message: 'FAILED'
    // });
    // this.wrapperRefs[id].location;
    this.cd.detectChanges();
  }

  emitValues() {
    const values = Object.values(this.valueState);
    this.update.emit(values ? {
      values: values.map(value => value.value),
      valid: values && values.length > 0 && !values.find(user => !user.valid)
    } : {
        values: [],
        valid: false
      });
  }

  remove(index: number) {
    this.inputs.remove(index);
    // this.wrapperRefs.
  }

  ngOnInit() {
    this.add();
    // this.add();
    // this.remove();
    this.subs.push(this.state$.subscribe(states => {
      states.forEach((state, index) => this.components[index].stateSubject.next(state));
    }));
  }

  ngOnDestroy(): void {
    if (this.inputs) {
      this.inputs.clear();
    }
    safeUnsubscribe(...this.subs);
  }

}
