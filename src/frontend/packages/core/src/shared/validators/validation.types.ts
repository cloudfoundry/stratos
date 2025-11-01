import { AbstractControl, ValidationErrors, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';

/**
 * Standard validation error keys used across the application
 */
export enum ValidationErrorKey {
  REQUIRED = 'required',
  INVALID_URL = 'invalidUrl',
  INVALID_EMAIL = 'invalidEmail',
  MIN_LENGTH = 'minlength',
  MAX_LENGTH = 'maxlength',
  PATTERN = 'pattern',
  UNIQUE = 'unique',
  API_ERROR = 'apiError',
  WHITESPACE = 'whitespace',
  INVALID_PORT = 'invalidPort',
}

/**
 * Validation error structure with human-readable messages
 */
export interface ValidationError {
  key: ValidationErrorKey;
  message: string;
  params?: Record<string, any>;
}

/**
 * Configuration for URL validator
 */
export interface UrlValidatorConfig {
  /** Require HTTPS protocol */
  requireHttps?: boolean;
  /** Allow HTTP protocol */
  allowHttp?: boolean;
  /** Allow custom protocols (ws://, wss://, etc.) */
  allowCustomProtocols?: string[];
  /** Auto-normalize URLs (prepend https:// if missing) */
  autoNormalize?: boolean;
  /** Allow IP addresses */
  allowIpAddress?: boolean;
  /** Require port specification */
  requirePort?: boolean;
}

/**
 * Configuration for async uniqueness validator
 */
export interface UniquenessValidatorConfig<T = any> {
  /** Function to check if value exists */
  checkFn: (value: string) => Promise<boolean> | Observable<boolean>;
  /** Debounce time in ms (default: 300) */
  debounceMs?: number;
  /** Case-sensitive comparison */
  caseSensitive?: boolean;
  /** Error message override */
  errorMessage?: string;
}

/**
 * Validator factory return type with metadata
 */
export interface ValidatorFactory<TConfig = any> {
  validator: ValidatorFn | AsyncValidatorFn;
  config: TConfig;
  description: string;
}
