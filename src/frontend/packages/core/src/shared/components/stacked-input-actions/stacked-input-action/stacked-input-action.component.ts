import {
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { StackedInputActionsState } from '../stacked-input-actions.component';

export enum StackedInputActionResult {
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  OTHER_VALUES_UPDATED = 'UPDATE_OTHER_VALUES'
}

export interface StackedInputActionConfig {
  isEmailInput: boolean;
  text: {
    placeholder: string,
    requiredError: string,
    uniqueError: string,
  };
}

export interface StackedInputActionUpdate {
  key: number;
  value: string;
  valid: boolean;
}

/**
 * Individual text input field meant to be stacked amongst others of same type in a . Used in conjunction with StackedInputActionsComponent
 */
@Component({
  selector: 'app-stacked-input-action',
  templateUrl: './stacked-input-action.component.html',
  styleUrls: ['./stacked-input-action.component.scss']
})
export class StackedInputActionComponent implements OnInit, OnDestroy, AfterContentInit {

  static defaultConfig = {
    isEmailInput: true,
    text: {
      placeholder: 'Email',
      requiredError: 'Email is required',
      uniqueError: 'Email is not unique'
    }
  };
  @Input() stateIn$: Observable<StackedInputActionsState>;
  @Input() position: number;
  @Input() showRemove: boolean;
  @Input() key: number;
  private pConfig: StackedInputActionConfig;
  @Input()
  set config(config: StackedInputActionConfig) {
    this.pConfig = config;
  }
  get config(): StackedInputActionConfig {
    return this.pConfig || StackedInputActionComponent.defaultConfig;
  }

  @Output() stateOut = new EventEmitter<StackedInputActionUpdate>();
  @Output() remove = new EventEmitter<any>();

  @ViewChild('inputElement', { static: true }) inputElement: ElementRef;

  public result = StackedInputActionResult;
  public textFormControl = new UntypedFormControl('', [Validators.required, this.uniqueValidator.bind(this)]);
  public state: StackedInputActionsState;
  private subs: Subscription[] = [];
  private otherValues: string[];

  ngOnInit() {
    const validators = [Validators.required, this.uniqueValidator.bind(this)];
    if (this.config.isEmailInput) {
      validators.push(Validators.email);
    }
    this.textFormControl = new UntypedFormControl('', validators);

    // Emit any changes of form state outwards.
    this.subs.push(this.textFormControl.valueChanges.subscribe((value) => {
      this.stateOut.emit({
        key: this.key,
        value,
        // Component is valid if form is ok OR it's already succeeded
        valid: this.state && this.state.result === StackedInputActionResult.SUCCEEDED || this.textFormControl.valid
      });
    }));

    // Handle change of state from outside
    this.subs.push(this.stateIn$.subscribe(this.handleStateIn.bind(this)));
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
  }

  ngAfterContentInit() {
    this.inputElement.nativeElement.focus();
  }

  uniqueValidator(control: UntypedFormControl) {
    // custom unique validator that has quick access to the recently changed otherValues array
    if (!this.otherValues ||
      !this.otherValues.find(otherValue => otherValue === control.value)) {
      return null;
    }
    return {
      notUnique: true
    };
  }

  private compare(a: string[], b: string[]): boolean {
    if (!a && b || a && !b) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    return a.filter((aString) => b.find(bString => aString === bString)).length === a.length;
  }

  private handleStateIn(incState: StackedInputActionsState) {
    if (!incState) {
      this.state = incState;
      this.textFormControl.enable();
      return;
    }
    switch (incState.result) {
      case StackedInputActionResult.PROCESSING:
      case StackedInputActionResult.SUCCEEDED:
        this.state = incState;
        this.textFormControl.disable();
        break;
      case StackedInputActionResult.FAILED:
        this.state = incState;
        this.textFormControl.enable();
        break;
      case StackedInputActionResult.OTHER_VALUES_UPDATED:
        const oldValues = this.otherValues || [];
        this.otherValues = incState.otherValues;
        if (!this.compare(oldValues, this.otherValues)) {
          // Force validation
          this.textFormControl.setValue(this.textFormControl.value);
        }
        break;
    }
  }

}
