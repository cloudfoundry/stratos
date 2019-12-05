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
import { FormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { StackedInputActionsState } from '../stacked-input-actions.component';

export enum StackedInputActionResult {
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  OTHER_VALUES_UPDATED = 'UPDATE_OTHER_VALUES'
}

export interface StackedInputActionUpdate {
  key: number;
  value: string;
  valid: boolean;
}

/**
 * Individual email input field meant to be stacked amongst others of same type in a . Used in conjunction with StackedInputActionsComponent
 */
@Component({
  selector: 'app-stacked-input-action',
  templateUrl: './stacked-input-action.component.html',
  styleUrls: ['./stacked-input-action.component.scss']
})
export class StackedInputActionComponent implements OnInit, OnDestroy, AfterContentInit {

  @Input() stateIn$: Observable<StackedInputActionsState>;
  @Input() position: number;
  @Input() showRemove: boolean;
  @Input() key: number;

  @Output() stateOut = new EventEmitter<StackedInputActionUpdate>();
  @Output() remove = new EventEmitter<any>();

  @ViewChild('inputElement', { static: true }) inputElement: ElementRef;

  public result = StackedInputActionResult;
  public emailFormControl = new FormControl('', [Validators.required, Validators.email, this.uniqueValidator.bind(this)]);
  public state: StackedInputActionsState;
  private subs: Subscription[] = [];
  private otherValues: string[];

  constructor() { }

  ngOnInit() {
    // Emit any changes of form state outwards.
    this.subs.push(this.emailFormControl.valueChanges.subscribe((value) => {
      this.stateOut.emit({
        key: this.key,
        value,
        // Component is valid if form is ok OR it's already succeeded
        valid: this.state && this.state.result === StackedInputActionResult.SUCCEEDED || this.emailFormControl.valid
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

  uniqueValidator(control: FormControl) {
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
      this.emailFormControl.enable();
      return;
    }
    switch (incState.result) {
      case StackedInputActionResult.PROCESSING:
      case StackedInputActionResult.SUCCEEDED:
        this.state = incState;
        this.emailFormControl.disable();
        break;
      case StackedInputActionResult.FAILED:
        this.state = incState;
        this.emailFormControl.enable();
        break;
      case StackedInputActionResult.OTHER_VALUES_UPDATED:
        const oldValues = this.otherValues || [];
        this.otherValues = incState.otherValues;
        if (!this.compare(oldValues, this.otherValues)) {
          // Force validation
          this.emailFormControl.setValue(this.emailFormControl.value);
        }
        break;
    }
  }

}
