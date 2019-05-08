import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appUnique]',
  providers: [{ provide: NG_VALIDATORS, useExisting: UniqueDirective, multi: true }]
})
export class UniqueDirective implements Validator {
  constructor() { }

  @Input() appUnique: any[];

  validate(c: AbstractControl): { [key: string]: any; } {
    const found = this.appUnique ? this.appUnique.indexOf(c.value) >= 0 : false;
    return found ? {
      appUnique: {
        message: 'Value is not unique'
      }
    } : null;
  }

}
