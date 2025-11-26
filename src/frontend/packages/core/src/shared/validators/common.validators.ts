import type {AbstractControl} from '@angular/forms';
import type {ValidationErrors, ValidatorFn} from '@angular/forms';
import { ValidationErrorKey } from './validation.types';

/**
 * Validator that disallows whitespace-only values
 */
export function noWhitespace(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { [ValidationErrorKey.WHITESPACE]: true } : null;
  };
}

/**
 * Email validator with RFC 5322 compliance
 */
export function email(): ValidatorFn {
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.trim();
    return emailPattern.test(value) ? null : { [ValidationErrorKey.INVALID_EMAIL]: true };
  };
}

/**
 * Port number validator (1-65535)
 */
export function portNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const port = parseInt(control.value, 10);

    if (Number.isNaN(port) || port < 1 || port > 65535) {
      return {
        [ValidationErrorKey.INVALID_PORT]: {
          message: 'Port must be between 1 and 65535',
          actualValue: control.value,
        }
      };
    }

    return null;
  };
}
