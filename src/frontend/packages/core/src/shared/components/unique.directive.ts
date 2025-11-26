import { Directive, forwardRef, Input, type OnChanges, type SimpleChanges } from '@angular/core';
import { type AbstractControl, NG_VALIDATORS, type Validator } from '@angular/forms';

@Directive({
  selector: '[appUnique]',
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => UniqueDirective), multi: true }],
  standalone: true
})
export class UniqueDirective implements Validator, OnChanges {
  private _control!: AbstractControl;

  @Input() appUnique!: unknown[];

  ngOnChanges(changes: SimpleChanges): void {
    // When the appUnique input changes, re-validate the control
    if (changes.appUnique && this._control) {
      this._control.updateValueAndValidity();
    }
  }

  validate(c: AbstractControl): { [key: string]: unknown } | null {
    // Store reference to control so we can trigger re-validation in ngOnChanges
    this._control = c;

    const found = this.appUnique ? this.appUnique.indexOf(c.value) >= 0 : false;
    return found ? {
      appUnique: {
        message: 'Value is not unique'
      }
    } : null;
  }

}
