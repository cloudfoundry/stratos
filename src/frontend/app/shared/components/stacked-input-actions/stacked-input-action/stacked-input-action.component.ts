import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { StackedInputActionsState } from '../stacked-input-actions.component';

export enum StackedInputActionResult {
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
}

export interface StackedInputActionUpdate { value: string; valid: boolean; }

@Component({
  selector: 'app-stacked-input-action',
  templateUrl: './stacked-input-action.component.html',
  styleUrls: ['./stacked-input-action.component.scss']
})
export class StackedInputActionComponent implements OnInit, OnDestroy {


  @Input() state$: Observable<StackedInputActionsState>;
  result = StackedInputActionResult;
  @Output() update = new EventEmitter<StackedInputActionUpdate>();
  @Output() remove = new EventEmitter<any>();

  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  state: StackedInputActionsState;
  subs: Subscription[] = [];

  constructor() { }

  ngOnInit() {
    this.subs.push(this.emailFormControl.valueChanges.subscribe((value) => {
      this.update.emit({ value, valid: this.emailFormControl.valid });
    }));

    this.subs.push(this.state$.subscribe(incState => {
      this.state = incState;
      if (incState && incState.result === StackedInputActionResult.PROCESSING) {
        this.emailFormControl.disable();
      } else {
        this.emailFormControl.enable();
      }
    }));
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
  }


}
