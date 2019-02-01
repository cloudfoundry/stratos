import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { StackedInputActionsState } from '../stacked-input-actions.component';

export enum StackedInputActionResult {
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE'
}

export interface StackedInputActionUpdate {
  key: number;
  value: string;
  valid: boolean;
}

@Component({
  selector: 'app-stacked-input-action',
  templateUrl: './stacked-input-action.component.html',
  styleUrls: ['./stacked-input-action.component.scss']
})
export class StackedInputActionComponent implements OnInit, OnDestroy {

  private static NOT_UNIQUE = 'notUnique'; // TODO: RC
  private static validators = [Validators.required, Validators.email];

  @Input() stateIn$: Observable<StackedInputActionsState>;
  @Input() position: number;
  @Input() showRemove: boolean;
  @Input() key: number;
  @Output() stateOut = new EventEmitter<StackedInputActionUpdate>();
  @Output() remove = new EventEmitter<any>();

  result = StackedInputActionResult;
  emailFormControl = new FormControl('', StackedInputActionComponent.validators);
  state: StackedInputActionsState;
  subs: Subscription[] = [];
  otherEmails: string[]; // TODO: RC

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
    this.subs.push(this.stateIn$.subscribe(incState => {
      this.state = incState;
      if (!incState) {
        this.emailFormControl.enable();
        return;
      }
      switch (incState.result) {
        case StackedInputActionResult.PROCESSING:
        case StackedInputActionResult.SUCCEEDED:
          this.emailFormControl.disable();
          // this.setPattern(false);
          break;
        case StackedInputActionResult.FAILED:
          this.emailFormControl.enable();
          break;
        case StackedInputActionResult.DUPLICATE:
          // (?![a|b]).
          // const oldOtherEmails = this.otherEmails || [];

          // const newOtherEmails = incState.message.split(',');
          // newOtherEmails.pop();
          // this.otherEmails = incState.message && incState.message.length ? newOtherEmails : [];
          // if (!this.compare(oldOtherEmails, this.otherEmails)) {
          //   this.emailFormControl.updateValueAndValidity();
          // }
          // const pattern = '(?![a|b])';
          // this.emailFormControl.setValidators([...StackedInputActionComponent.validators, Validators.pattern(pattern)]);

          // this.setPattern(true);
          break;
        default:
          // this.setPattern(false);
          break;

      }
    }));
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

  private setPattern(dupe: boolean) {
    if (dupe !== !!this.emailFormControl.getError(StackedInputActionComponent.NOT_UNIQUE)) {
      // this.emailFormControl.setErrors({
      //   email: !!this.emailFormControl.getError('email'),
      //   [StackedInputActionComponent.NOT_UNIQUE]: dupe
      // });
      // this.emailFormControl.
      // if (this.emailFormControl.errors &&
      // this.emailFormControl.markAsDirty();
      const pattern = '(?![a|b])';
      this.emailFormControl.setValidators([...StackedInputActionComponent.validators, Validators.pattern(pattern)]);
      this.emailFormControl.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
  }


}
