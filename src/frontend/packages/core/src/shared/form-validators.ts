import type {AbstractControl, ValidationErrors} from '@angular/forms';
import type {ValidatorFn} from '@angular/forms';

export function isValidJsonValidator(): ValidatorFn {
  return (formField: AbstractControl): ValidationErrors | null => {
    if (formField.value) {
      try {
        const jsonObj = JSON.parse(formField.value);
        // Check if jsonObj is actually an obj
        if (jsonObj.constructor !== {}.constructor) {
          throw new Error('not an object');
        }
      } catch (_e) {
        return { notValidJson: { value: formField.value } };
      }
    }
    return null;
  };
}
