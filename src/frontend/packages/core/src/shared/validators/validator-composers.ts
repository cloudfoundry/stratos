import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Compose multiple validators with AND logic (all must pass)
 *
 * @example
 * ```typescript
 * const strictUrlValidator = composeValidators([
 *   createUrlValidator({ requireHttps: true }),
 *   requireProtocol(),
 * ]);
 * ```
 */
export function composeValidators(validators: ValidatorFn[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const errors: ValidationErrors = {};

    for (const validator of validators) {
      const error = validator(control);
      if (error) {
        Object.assign(errors, error);
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Compose validators with OR logic (at least one must pass)
 * Useful for "either/or" validation scenarios
 *
 * @example
 * ```typescript
 * const flexibleValidator = composeValidatorsOr([
 *   createUrlValidator({ allowHttp: true }),
 *   email(),
 * ]);
 * ```
 */
export function composeValidatorsOr(validators: ValidatorFn[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    for (const validator of validators) {
      const error = validator(control);
      if (!error) {
        return null; // At least one passed
      }
    }

    // All failed, return combined errors
    const errors: ValidationErrors = {};
    for (const validator of validators) {
      const error = validator(control);
      if (error) {
        Object.assign(errors, error);
      }
    }

    return errors;
  };
}

/**
 * Conditional validator that applies validation only when condition is met
 *
 * @example
 * ```typescript
 * const conditionalHttps = conditionalValidator(
 *   (control) => control.parent?.get('requireSecure')?.value === true,
 *   createUrlValidator({ requireHttps: true })
 * );
 * ```
 */
export function conditionalValidator(
  condition: (control: AbstractControl) => boolean,
  validator: ValidatorFn
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (condition(control)) {
      return validator(control);
    }
    return null;
  };
}
