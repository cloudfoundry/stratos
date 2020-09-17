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
  StackedInputActionConfig,
  StackedInputActionResult,
  StackedInputActionUpdate,
} from './stacked-input-action/stacked-input-action.component';

export interface StackedInputActionsState {
  key: string;
  result: StackedInputActionResult;
  message?: string;
  otherValues?: any;
}

export interface StackedInputActionsUpdate { values: { [key: string]: string }; valid: boolean; }

/**
 * Host for a collection of StackedInputActionComponent components
 */
@Component({
  selector: 'app-stacked-input-actions',
  templateUrl: './stacked-input-actions.component.html',
  styleUrls: ['./stacked-input-actions.component.scss'],
  entryComponents: [StackedInputActionComponent]
})
export class StackedInputActionsComponent implements OnInit, OnDestroy {

  @Input() stateIn$: Observable<StackedInputActionsState[]>;
  @Input() isEmailInput = true;
  @Input() stackedActionConfig: StackedInputActionConfig;

  @Output() stateOut = new EventEmitter<StackedInputActionsUpdate>();

  @ViewChild('inputs', { read: ViewContainerRef, static: true })
  inputs: ViewContainerRef;

  disabled = false;
  private count = 0;

  private wrapperFactory: ComponentFactory<StackedInputActionComponent>;
  private components: {
    [key: number]: {
      stateIn: Subject<StackedInputActionsState>,
      stackedAction: StackedInputActionComponent,
      update: StackedInputActionUpdate
    }
  } = {};
  private subs: Subscription[] = [];

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private cd: ChangeDetectorRef,
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(StackedInputActionComponent);
  }

  addComponent() {
    const component = this.inputs.createComponent(this.wrapperFactory);

    const stackedAction = component.instance;
    // Track a unique key for the component and it's position in the stack
    stackedAction.key = this.count++;
    stackedAction.position = this.inputs.length - 1;
    stackedAction.config = this.stackedActionConfig;
    // Handle when the component wants to be removed
    this.subs.push(stackedAction.remove.subscribe(() => {
      this.removeComponent(stackedAction);
      this.emitState();
    }));
    // Handle updates of state from the compnent
    this.subs.push(stackedAction.stateOut.subscribe((update: StackedInputActionUpdate) => {
      const hasChanges = Object.keys(update).filter(key => update[key] !== this.components[update.key].update).length;
      if (hasChanges) {
        this.components[update.key].update = update;
        this.emitState();
      }
    }));

    // Track how we push state into the component
    const stateIn = new BehaviorSubject<StackedInputActionsState>(null);
    stackedAction.stateIn$ = stateIn.asObservable();

    // Track them all together in one pot
    this.components[stackedAction.key] = {
      stateIn,
      stackedAction,
      update: null
    };

    this.cd.detectChanges();

    // Ensure all components know their new position
    this.updatePositions();
  }

  emitState() {
    const components = Object.values(this.components);
    // Emit a list of values for all components that should be processed. This does not include succeeded components
    const valuesToSubmit = components ? components.reduce((values, component) => {
      if (!component.stackedAction.state || component.stackedAction.state.result !== StackedInputActionResult.SUCCEEDED) {
        values[component.stackedAction.key] = component.update.value;
      }
      return values;
    }, {}) : [];
    // Values can be submitted if there's values and those values are valid
    const valid = components && Object.keys(valuesToSubmit).length && components.length > 0 ?
      !components.find(component => !component.update.valid) : false;
    this.stateOut.emit({ values: valuesToSubmit, valid });
    this.updateOtherValues();
  }

  removeComponent(stackedAction: StackedInputActionComponent) {
    // Remove the visual component
    this.inputs.remove(stackedAction.position);
    // Remove the tracked component
    delete this.components[stackedAction.key];
    // Update all components with their new position
    this.updatePositions();
  }

  private updatePositions() {
    // Ensure all components know which position they are and whether they can be removed or not
    const componentCount = this.inputs.length;
    Object.values(this.components).sort((a, b) => a.stackedAction.key < b.stackedAction.key ? 1 : 0).forEach((component, position) => {
      component.stackedAction.position = position;
      component.stackedAction.showRemove = position > 0 || componentCount > 1;
    });
  }

  private updateOtherValues() {
    // Ensure components are aware of each others values
    Object.entries(this.components).forEach(([key, component]) => {
      component.stateIn.next({
        key,
        result: StackedInputActionResult.OTHER_VALUES_UPDATED,
        otherValues: Object.values(this.components)
          .filter(fComponent => component.stackedAction.key !== fComponent.stackedAction.key)
          .map(mComponent => mComponent.update.value)
          .filter(value => !!value && value.length)
      });
    });
  }

  ngOnInit() {
    // Add the first component
    this.addComponent();
    // Push state change into their respective components
    this.subs.push(this.stateIn$.subscribe(states => {
      // Disable the 'add new' button
      this.disabled = !!states.find(state => state.result === StackedInputActionResult.PROCESSING);
      // Push state
      states.forEach((state, index) => this.components[state.key].stateIn.next(state));
    }));
  }

  ngOnDestroy(): void {
    if (this.inputs) {
      this.inputs.clear();
    }
    safeUnsubscribe(...this.subs);
  }

  onKeydown(event) {
    if (event.key === 'Enter') {
      this.addComponent();
    }
  }

}
