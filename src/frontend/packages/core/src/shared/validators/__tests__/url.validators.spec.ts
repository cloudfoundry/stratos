import { FormControl } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { createUrlValidator, normalizeUrl, cfEndpointUrlValidator, gitRepositoryUrlValidator, requireProtocol } from '../url.validators';
import { ValidationErrorKey } from '../validation.types';

describe('URL Validators', () => {
  describe('createUrlValidator()', () => {
    describe('with default config', () => {
      const validator = createUrlValidator();

      it('should accept valid domain URLs', () => {
        const testCases = [
          'example.com',
          'api.example.com',
          'my-api.example.io',
          'api.sys.adepttech.ca',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          expect(validator(control)).toBeNull();
        });
      });

      it('should accept valid URLs with protocol', () => {
        const testCases = [
          'https://example.com',
          'http://api.example.com',
          'https://my-api.example.io',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          expect(validator(control)).toBeNull();
        });
      });

      it('should accept IP addresses', () => {
        const testCases = [
          '192.168.1.1',
          '10.0.0.1',
          'https://192.168.1.1',
          'http://10.0.0.1',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          expect(validator(control)).toBeNull();
        });
      });

      it('should accept URLs with ports', () => {
        const testCases = [
          'example.com:8080',
          'https://example.com:443',
          '192.168.1.1:8080',
          'http://api.example.com:3000',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          expect(validator(control)).toBeNull();
        });
      });

      it('should accept URLs with paths', () => {
        const testCases = [
          'https://example.com/api/v1',
          'example.com/path/to/api',
          'api.example.com:8080/v2/info',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          expect(validator(control)).toBeNull();
        });
      });

      it('should reject invalid formats', () => {
        const testCases = [
          'not a url',
          'ht!tp://example.com',
          '!!!invalid',
          'just some text',
        ];

        testCases.forEach(url => {
          const control = new FormControl(url);
          const result = validator(control);
          expect(result).not.toBeNull();
          expect(result?.[ValidationErrorKey.INVALID_URL]).toBeDefined();
        });
      });

      it('should allow empty values (use Validators.required separately)', () => {
        const control = new FormControl('');
        expect(validator(control)).toBeNull();

        const control2 = new FormControl(null);
        expect(validator(control2)).toBeNull();
      });

      it('should trim whitespace before validation', () => {
        const control = new FormControl('  example.com  ');
        expect(validator(control)).toBeNull();
      });
    });

    describe('with requireHttps: true', () => {
      const validator = createUrlValidator({ requireHttps: true });

      it('should accept HTTPS URLs', () => {
        const control = new FormControl('https://example.com');
        expect(validator(control)).toBeNull();
      });

      it('should reject HTTP URLs', () => {
        const control = new FormControl('http://example.com');
        const result = validator(control);
        expect(result).not.toBeNull();
        expect(result?.[ValidationErrorKey.INVALID_URL].message).toContain('HTTPS');
      });

      it('should accept URLs without protocol (assumes HTTPS)', () => {
        const control = new FormControl('example.com');
        expect(validator(control)).toBeNull();
      });
    });

    describe('with allowIpAddress: false', () => {
      const validator = createUrlValidator({ allowIpAddress: false });

      it('should accept domain URLs', () => {
        const control = new FormControl('example.com');
        expect(validator(control)).toBeNull();
      });

      it('should reject IP addresses', () => {
        const control = new FormControl('192.168.1.1');
        const result = validator(control);
        expect(result).not.toBeNull();
        expect(result?.[ValidationErrorKey.INVALID_URL].message).toContain('IP');
      });
    });

    describe('with requirePort: true', () => {
      const validator = createUrlValidator({ requirePort: true });

      it('should accept URLs with ports', () => {
        const control = new FormControl('example.com:8080');
        expect(validator(control)).toBeNull();
      });

      it('should reject URLs without ports', () => {
        const control = new FormControl('example.com');
        const result = validator(control);
        expect(result).not.toBeNull();
        expect(result?.[ValidationErrorKey.INVALID_PORT]).toBeDefined();
      });

      it('should reject invalid port numbers', () => {
        const control = new FormControl('example.com:99999');
        const result = validator(control);
        expect(result).not.toBeNull();
        expect(result?.[ValidationErrorKey.INVALID_PORT]).toBeDefined();
      });
    });

    describe('with allowHttp: false', () => {
      const validator = createUrlValidator({ allowHttp: false });

      it('should accept HTTPS URLs', () => {
        const control = new FormControl('https://example.com');
        expect(validator(control)).toBeNull();
      });

      it('should reject HTTP URLs', () => {
        const control = new FormControl('http://example.com');
        const result = validator(control);
        expect(result).not.toBeNull();
        expect(result?.[ValidationErrorKey.INVALID_URL].message).toContain('HTTP');
      });
    });
  });

  describe('normalizeUrl()', () => {
    it('should prepend https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('api.sys.adepttech.ca')).toBe('https://api.sys.adepttech.ca');
    });

    it('should preserve existing protocols', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should handle empty strings', () => {
      expect(normalizeUrl('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizeUrl(null as any)).toBe(null);
      expect(normalizeUrl(undefined as any)).toBe(undefined);
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });
  });

  describe('requireProtocol()', () => {
    const validator = requireProtocol();

    it('should accept URLs with protocol', () => {
      const testCases = [
        'http://example.com',
        'https://example.com',
      ];

      testCases.forEach(url => {
        const control = new FormControl(url);
        expect(validator(control)).toBeNull();
      });
    });

    it('should reject URLs without protocol', () => {
      const control = new FormControl('example.com');
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.[ValidationErrorKey.INVALID_URL].message).toContain('protocol');
    });

    it('should allow empty values', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('cfEndpointUrlValidator', () => {
    it('should match existing CF endpoint validation behavior', () => {
      // Test cases from actual CF endpoint usage
      const validUrls = [
        'api.cf.example.com',
        'https://api.cf.example.com',
        'http://192.168.1.1:8080',
        'cf.local/api',
        'api.sys.adepttech.ca',
      ];

      validUrls.forEach(url => {
        const control = new FormControl(url);
        expect(cfEndpointUrlValidator(control)).toBeNull();
      });

      const invalidUrls = [
        'not a url',
        '!!!invalid',
        'ht!tp://bad',
      ];

      invalidUrls.forEach(url => {
        const control = new FormControl(url);
        expect(cfEndpointUrlValidator(control)).not.toBeNull();
      });
    });
  });

  describe('gitRepositoryUrlValidator', () => {
    it('should match existing Git endpoint validation behavior', () => {
      const validUrls = [
        'github.com',
        'https://github.com/org/repo',
        'https://github.enterprise.com',
        'gitlab.com',
        'http://192.168.1.1:3000',
      ];

      validUrls.forEach(url => {
        const control = new FormControl(url);
        expect(gitRepositoryUrlValidator(control)).toBeNull();
      });

      const invalidUrls = [
        'not a url',
        '!!!',
      ];

      invalidUrls.forEach(url => {
        const control = new FormControl(url);
        expect(gitRepositoryUrlValidator(control)).not.toBeNull();
      });
    });
  });
});
