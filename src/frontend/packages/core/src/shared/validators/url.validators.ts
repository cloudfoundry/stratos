import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UrlValidatorConfig, ValidationErrorKey } from './validation.types';

/**
 * Default URL validator configuration
 */
const DEFAULT_URL_CONFIG: UrlValidatorConfig = {
  requireHttps: false,
  allowHttp: true,
  allowCustomProtocols: [],
  autoNormalize: false,
  allowIpAddress: true,
  requirePort: false,
};

/**
 * Regular expressions for URL validation
 */
const URL_PATTERNS = {
  // Domain-based URL: http(s)://example.com or example.com
  domain: /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\:[0-9]{1,5})?(\/.*)?$/,

  // IP-based URL: http(s)://1.2.3.4 or 1.2.3.4
  ipAddress: /^(https?:\/\/)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\:[0-9]{1,5})?(\/.*)?$/,

  // Protocol extraction
  protocol: /^([a-z][a-z0-9+.-]*):\/\//i,

  // Port extraction
  port: /:(\d{1,5})(\/|$)/,
};

/**
 * Factory function for URL validator with configurable options
 *
 * @example
 * ```typescript
 * // Basic usage
 * const urlValidator = createUrlValidator();
 *
 * // Require HTTPS only
 * const httpsValidator = createUrlValidator({ requireHttps: true });
 *
 * // Allow custom protocols (WebSocket)
 * const wsValidator = createUrlValidator({
 *   allowCustomProtocols: ['ws', 'wss']
 * });
 * ```
 */
export function createUrlValidator(config: UrlValidatorConfig = {}): ValidatorFn {
  const cfg = { ...DEFAULT_URL_CONFIG, ...config };

  return (control: AbstractControl): ValidationErrors | null => {
    // Allow empty values (use Validators.required separately)
    if (!control.value) {
      return null;
    }

    const value = control.value.trim();

    // Check protocol requirements
    const protocolMatch = value.match(URL_PATTERNS.protocol);
    const protocol = protocolMatch ? protocolMatch[1].toLowerCase() : null;

    // Validate protocol constraints
    if (protocol) {
      if (cfg.requireHttps && protocol !== 'https') {
        return {
          [ValidationErrorKey.INVALID_URL]: {
            message: 'HTTPS protocol is required',
            actualProtocol: protocol,
          }
        };
      }

      if (!cfg.allowHttp && protocol === 'http') {
        return {
          [ValidationErrorKey.INVALID_URL]: {
            message: 'HTTP protocol is not allowed',
            actualProtocol: protocol,
          }
        };
      }

      const allowedProtocols = ['http', 'https', ...cfg.allowCustomProtocols];
      if (!allowedProtocols.includes(protocol)) {
        return {
          [ValidationErrorKey.INVALID_URL]: {
            message: `Protocol '${protocol}' is not allowed`,
            actualProtocol: protocol,
            allowedProtocols,
          }
        };
      }
    }

    // Validate port if required
    if (cfg.requirePort) {
      const portMatch = value.match(URL_PATTERNS.port);
      if (!portMatch) {
        return {
          [ValidationErrorKey.INVALID_PORT]: {
            message: 'Port number is required',
          }
        };
      }

      const port = parseInt(portMatch[1], 10);
      if (port < 1 || port > 65535) {
        return {
          [ValidationErrorKey.INVALID_PORT]: {
            message: 'Port must be between 1 and 65535',
            actualPort: port,
          }
        };
      }
    }

    // Validate URL format
    const isDomain = URL_PATTERNS.domain.test(value);
    const isIp = URL_PATTERNS.ipAddress.test(value);

    if (!isDomain && !isIp) {
      return {
        [ValidationErrorKey.INVALID_URL]: {
          message: 'Invalid URL format',
        }
      };
    }

    if (isIp && !cfg.allowIpAddress) {
      return {
        [ValidationErrorKey.INVALID_URL]: {
          message: 'IP addresses are not allowed',
        }
      };
    }

    return null;
  };
}

/**
 * Normalize URL by prepending https:// if protocol is missing
 *
 * @param url - URL string to normalize
 * @returns Normalized URL with protocol
 *
 * @example
 * ```typescript
 * normalizeUrl('example.com') // => 'https://example.com'
 * normalizeUrl('http://example.com') // => 'http://example.com'
 * ```
 */
export function normalizeUrl(url: string): string {
  if (!url) {
    return url;
  }

  const trimmed = url.trim();

  // Already has protocol
  if (URL_PATTERNS.protocol.test(trimmed)) {
    return trimmed;
  }

  // Prepend https://
  return `https://${trimmed}`;
}

/**
 * Validator that requires protocol-qualified URLs
 */
export function requireProtocol(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.trim();

    if (!URL_PATTERNS.protocol.test(value)) {
      return {
        [ValidationErrorKey.INVALID_URL]: {
          message: 'URL must include protocol (http:// or https://)',
        }
      };
    }

    return null;
  };
}

/**
 * Pre-configured URL validator for Cloud Foundry endpoints
 * Matches existing behavior in create-endpoint-cf-step-1.component.ts
 */
export const cfEndpointUrlValidator = createUrlValidator({
  allowHttp: true,
  allowIpAddress: true,
  requirePort: false,
});

/**
 * Pre-configured URL validator for Git repositories
 * Matches existing behavior in git-registration.component.ts
 */
export const gitRepositoryUrlValidator = createUrlValidator({
  allowHttp: true,
  allowIpAddress: true,
  requirePort: false,
});
