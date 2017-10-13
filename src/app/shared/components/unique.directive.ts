import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, NG_ASYNC_VALIDATORS } from '@angular/forms';

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
  // registerOnValidatorChange?(fn: () => void): void {
  //   console.log('2sdfdsfdsfsdf');
  //   throw new Error('Method not implemented.');
  // }

}
