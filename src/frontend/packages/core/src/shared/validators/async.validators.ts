import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { UniquenessValidatorConfig, ValidationErrorKey } from './validation.types';

/**
 * Factory for async uniqueness validator
 *
 * @example
 * ```typescript
 * const uniqueNameValidator = createUniquenessValidator({
 *   checkFn: (name) => endpointService.checkNameExists(name),
 *   debounceMs: 300,
 *   caseSensitive: false,
 * });
 *
 * this.form = this.fb.group({
 *   name: ['', [Validators.required], [uniqueNameValidator]],
 * });
 * ```
 */
export function createUniquenessValidator<T = any>(
  config: UniquenessValidatorConfig<T>
): AsyncValidatorFn {
  const debounceMs = config.debounceMs ?? 300;

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    const value = config.caseSensitive
      ? control.value.trim()
      : control.value.trim().toLowerCase();

    return timer(debounceMs).pipe(
      switchMap(() => {
        const checkResult = config.checkFn(control.value);
        return checkResult instanceof Observable ? checkResult : of(checkResult);
      }),
      map(exists => {
        if (exists) {
          return {
            [ValidationErrorKey.UNIQUE]: {
              message: config.errorMessage || 'This value already exists',
              value: control.value,
            }
          };
        }
        return null;
      }),
      catchError(() => of(null)), // Gracefully handle errors
      distinctUntilChanged()
    );
  };
}

/**
 * Factory for async API validation
 * Useful for validating against backend services
 *
 * @example
 * ```typescript
 * const validateEndpointUrl = createApiValidator({
 *   validateFn: (url) => endpointService.validateConnection(url),
 *   errorMessage: 'Unable to connect to endpoint',
 * });
 * ```
 */
export function createApiValidator(config: {
  validateFn: (value: string) => Promise<boolean> | Observable<boolean>;
  errorMessage?: string;
  debounceMs?: number;
}): AsyncValidatorFn {
  const debounceMs = config.debounceMs ?? 500;

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    return timer(debounceMs).pipe(
      switchMap(() => {
        const result = config.validateFn(control.value);
        return result instanceof Observable ? result : of(result);
      }),
      map(isValid => {
        if (!isValid) {
          return {
            [ValidationErrorKey.API_ERROR]: {
              message: config.errorMessage || 'Validation failed',
              value: control.value,
            }
          };
        }
        return null;
      }),
      catchError((error) => {
        return of({
          [ValidationErrorKey.API_ERROR]: {
            message: config.errorMessage || 'Validation service unavailable',
            error: error.message,
          }
        });
      })
    );
  };
}
