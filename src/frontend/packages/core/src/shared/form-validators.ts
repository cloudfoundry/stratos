import { AbstractControl, ValidatorFn } from '@angular/forms';

export function isValidJsonValidator(): ValidatorFn {
  return (formField: AbstractControl): { [key: string]: any } => {
    if (formField.value) {
      try {
        const jsonObj = JSON.parse(formField.value);
        // Check if jsonObj is actually an obj
        if (jsonObj.constructor !== {}.constructor) {
          throw new Error('not an object');
        }
      } catch (e) {
        return { notValidJson: { value: formField.value } };
      }
    }
    return null;
  };
}
