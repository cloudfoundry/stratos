import { ValidationErrorKey } from './validation.types';

/**
 * Default error messages for validation errors
 */
export const DEFAULT_ERROR_MESSAGES: Record<ValidationErrorKey, string> = {
  [ValidationErrorKey.REQUIRED]: 'This field is required',
  [ValidationErrorKey.INVALID_URL]: 'Please enter a valid URL',
  [ValidationErrorKey.INVALID_EMAIL]: 'Please enter a valid email address',
  [ValidationErrorKey.MIN_LENGTH]: 'Value is too short',
  [ValidationErrorKey.MAX_LENGTH]: 'Value is too long',
  [ValidationErrorKey.PATTERN]: 'Invalid format',
  [ValidationErrorKey.UNIQUE]: 'This value already exists',
  [ValidationErrorKey.API_ERROR]: 'Validation failed',
  [ValidationErrorKey.WHITESPACE]: 'Value cannot be empty or whitespace only',
  [ValidationErrorKey.INVALID_PORT]: 'Invalid port number',
};

/**
 * Get human-readable error message for validation error
 *
 * @example
 * ```typescript
 * const control = this.form.get('url');
 * if (control?.errors) {
 *   const message = getValidationErrorMessage(control.errors);
 *   console.log(message); // "Please enter a valid URL"
 * }
 * ```
 */
export function getValidationErrorMessage(
  errors: Record<string, any>,
  customMessages?: Partial<Record<ValidationErrorKey, string>>
): string {
  const messages = { ...DEFAULT_ERROR_MESSAGES, ...customMessages };

  // Get first error key
  const firstErrorKey = Object.keys(errors)[0] as ValidationErrorKey;

  // Check if error has custom message embedded
  if (errors[firstErrorKey]?.message) {
    return errors[firstErrorKey].message;
  }

  // Use default message
  return messages[firstErrorKey] || 'Validation error';
}

/**
 * Get all validation error messages for a control
 */
export function getAllValidationErrorMessages(
  errors: Record<string, any>,
  customMessages?: Partial<Record<ValidationErrorKey, string>>
): string[] {
  const messages = { ...DEFAULT_ERROR_MESSAGES, ...customMessages };

  return Object.keys(errors).map(key => {
    const errorKey = key as ValidationErrorKey;

    // Check for embedded message
    if (errors[key]?.message) {
      return errors[key].message;
    }

    return messages[errorKey] || 'Validation error';
  });
}
