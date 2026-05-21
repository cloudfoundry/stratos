import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef, signal, Signal, inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { safeUnsubscribe } from '../../../core/utils.service';
import { CustomIconComponent } from '../custom-material/custom-material.component';
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
  standalone: true,
  imports: [
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackedInputActionsComponent implements OnInit, OnDestroy {
  private cd = inject(ChangeDetectorRef);
  private injector = inject(Injector);


  @Input() stateIn$!: Observable<StackedInputActionsState[]>;
  @Input() isEmailInput = true;
  @Input() stackedActionConfig!: StackedInputActionConfig;

  @Output() stateOut = new EventEmitter<StackedInputActionsUpdate>();

  @ViewChild('inputs', { read: ViewContainerRef, static: true })
  inputs!: ViewContainerRef;

  disabled = false;
  private count = 0;

  private components: {
    [key: string]: {
      stateInSignal: Signal<StackedInputActionsState>,
      stateInUpdate: (state: StackedInputActionsState) => void,
      stackedAction: StackedInputActionComponent,
      update: StackedInputActionUpdate
    }
  } = {};
  private subs: Subscription[] = [];

  addComponent(): void {
    const component = this.inputs.createComponent(StackedInputActionComponent);

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
      const updateRecord = update as Record<string, any>;
      const hasChanges = Object.keys(update).filter(key => updateRecord[key] !== this.components[update.key].update).length;
      if (hasChanges) {
        this.components[update.key].update = update;
        this.emitState();
      }
    }));

    // Track how we push state into the component using signals
    const stateInSignal = signal<StackedInputActionsState>(null);
    stackedAction.stateIn$ = toObservable(stateInSignal, { injector: this.injector });

    // Track them all together in one pot
    this.components[stackedAction.key] = {
      stateInSignal: stateInSignal.asReadonly(),
      stateInUpdate: (state: StackedInputActionsState) => stateInSignal.set(state),
      stackedAction,
      update: null
    };

    this.cd.detectChanges();

    // Ensure all components know their new position
    this.updatePositions();
  }

  emitState(): void {
    const components = Object.values(this.components);
    // Emit a list of values for all components that should be processed. This does not include succeeded components
    const valuesToSubmit = components ? components.reduce((values: Record<string, string>, component) => {
      if (!component.stackedAction.state || component.stackedAction.state.result !== StackedInputActionResult.SUCCEEDED) {
        values[component.stackedAction.key] = component.update.value;
      }
      return values;
    }, {} as Record<string, string>) : {};
    // Values can be submitted if there's values and those values are valid
    const valid = components && Object.keys(valuesToSubmit).length && components.length > 0 ?
      !components.find(component => !component.update.valid) : false;
    this.stateOut.emit({ values: valuesToSubmit, valid });
    this.updateOtherValues();
  }

  removeComponent(stackedAction: StackedInputActionComponent): void {
    // Remove the visual component
    this.inputs.remove(stackedAction.position);
    // Remove the tracked component
    delete this.components[stackedAction.key];
    // Update all components with their new position
    this.updatePositions();
  }

  private updatePositions(): void {
    // Ensure all components know which position they are and whether they can be removed or not
    const componentCount = this.inputs.length;
    Object.values(this.components).sort((a, b) => a.stackedAction.key < b.stackedAction.key ? 1 : 0).forEach((component, position) => {
      component.stackedAction.position = position;
      component.stackedAction.showRemove = position > 0 || componentCount > 1;
    });
  }

  private updateOtherValues(): void {
    // Ensure components are aware of each others values
    Object.entries(this.components).forEach(([key, component]) => {
      component.stateInUpdate({
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
      // Push state using signal update function
      states.forEach((state, _index) => this.components[state.key].stateInUpdate(state));
    }));
  }

  ngOnDestroy(): void {
    if (this.inputs) {
      this.inputs.clear();
    }
    safeUnsubscribe(...this.subs);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.addComponent();
    }
  }

}
