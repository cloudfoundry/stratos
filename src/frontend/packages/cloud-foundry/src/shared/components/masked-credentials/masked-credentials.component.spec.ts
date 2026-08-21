import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { MaskedCredentialsComponent, toCredentialFields, toCredentialField, maskEnvValue } from './masked-credentials.component';

describe('toCredentialFields — credential masking', () => {
  const fieldFor = (key: string, value: unknown) =>
    toCredentialFields({ [key]: value }).find(f => f.key === key)!;

  it('redacts only the password in an embedded-credential URL, keeping the rest visible', () => {
    const f = fieldFor('uri', 'postgres://user:s3cr3t@host:5432/db');
    expect(f.sensitive).toBe(true);
    expect(f.displayMasked).toBe('postgres://user:<redacted>@host:5432/db');
    // The real value is preserved for copy / reveal.
    expect(f.value).toBe('postgres://user:s3cr3t@host:5432/db');
  });

  it('fully masks a key-sensitive non-URL secret', () => {
    const f = fieldFor('password', 's3cr3t');
    expect(f.sensitive).toBe(true);
    expect(f.displayMasked).toBe('••••••••');
  });

  it('leaves a plain non-sensitive value unmasked', () => {
    const f = fieldFor('host', 'db.example.com');
    expect(f.sensitive).toBe(false);
  });

  it('does not mask a URL that carries no embedded credentials', () => {
    const f = fieldFor('dashboard_url', 'https://dashboard.example.com/db');
    expect(f.sensitive).toBe(false);
  });

  it('serialises a non-string value before masking', () => {
    const f = fieldFor('config', { nested: true });
    expect(f.value).toBe('{"nested":true}');
  });
});

describe('MaskedCredentialsComponent — reveal toggle', () => {
  it('shows the partial mask when hidden and the real value once revealed', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const c = TestBed.createComponent(MaskedCredentialsComponent).componentInstance;
    const field = { key: 'uri', value: 'postgres://user:s3cr3t@host/db', sensitive: true, displayMasked: 'postgres://user:<redacted>@host/db' };

    // Hidden by default.
    expect(c.displayValue(field)).toBe('postgres://user:<redacted>@host/db');

    c.toggleField('uri');
    expect(c.displayValue(field)).toBe('postgres://user:s3cr3t@host/db');

    // Toggling back re-masks.
    c.toggleField('uri');
    expect(c.displayValue(field)).toBe('postgres://user:<redacted>@host/db');
  });

  it('never masks a non-sensitive field regardless of reveal state', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const c = TestBed.createComponent(MaskedCredentialsComponent).componentInstance;
    const field = { key: 'host', value: 'db.example.com', sensitive: false, displayMasked: '••••••••' };
    expect(c.displayValue(field)).toBe('db.example.com');
  });
});

describe('toCredentialField — single-pair classification', () => {
  it('classifies one pair identically to toCredentialFields', () => {
    const single = toCredentialField('password', 's3cr3t');
    const viaSet = toCredentialFields({ password: 's3cr3t' })[0];
    expect(single).toEqual(viaSet);
  });

  it('redacts embedded credentials even when key is sensitive-named', () => {
    const field = toCredentialField('SECRET_URL', 'postgres://user:pass@host:5432/db');
    expect(field.sensitive).toBe(true);
    expect(field.displayMasked).toBe('postgres://user:<redacted>@host:5432/db');
  });
});

describe('maskEnvValue — deep env masking', () => {
  it('fully masks a scalar under a sensitive key', () => {
    expect(maskEnvValue('API_TOKEN', 'abc123')).toBe('••••••••');
    expect(maskEnvValue('DB_PASSWORD', 42)).toBe('••••••••');
  });

  it('redacts only the password in an embedded-credential string under a plain key', () => {
    expect(maskEnvValue('DATABASE_URL', 'postgres://user:s3cr3t@host:5432/db'))
      .toBe('postgres://user:<redacted>@host:5432/db');
  });

  it('leaves non-sensitive scalars untouched', () => {
    expect(maskEnvValue('PORT', '8080')).toBe('8080');
    expect(maskEnvValue('DEBUG', true)).toBe(true);
    expect(maskEnvValue('EMPTY', null)).toBe(null);
  });

  it('walks objects and masks only sensitive leaves (VCAP_SERVICES shape)', () => {
    const vcap = {
      'my-db': [{
        credentials: {
          hostname: 'db.local',
          password: 'pw',
          uri: 'postgres://u:pw@db.local/db',
        },
      }],
    };
    const masked = maskEnvValue('VCAP_SERVICES', vcap) as any;
    expect(masked['my-db'][0].credentials.hostname).toBe('db.local');
    expect(masked['my-db'][0].credentials.password).toBe('••••••••');
    expect(masked['my-db'][0].credentials.uri).toBe('postgres://u:<redacted>@db.local/db');
    // input untouched
    expect(vcap['my-db'][0].credentials.password).toBe('pw');
  });

  it('masks every element of an array under a sensitive key', () => {
    expect(maskEnvValue('SIGNING_KEYS', ['k1', 'k2'])).toEqual(['••••••••', '••••••••']);
  });

  it('redacts embedded credentials even when key is sensitive-named', () => {
    expect(maskEnvValue('SECRET_URL', 'postgres://user:pass@host:5432/db'))
      .toBe('postgres://user:<redacted>@host:5432/db');
  });

  it('recurses an object under a sensitive key rather than blanket-masking it (known leaf-based ceiling)', () => {
    const masked = maskEnvValue('SIGNING_KEY', { material: 'raw-bytes', algorithm: 'RS256' }) as any;
    expect(masked.material).toBe('raw-bytes');
    expect(masked.algorithm).toBe('RS256');
  });
});

describe('PEM private-key detection (by value)', () => {
  // Build PEM strings from a template so no complete private-key header
  // literal sits in the source (secret scanners pattern-match on it).
  const pemBlock = (label: string) =>
    `-----BEGIN ${label}-----\nZHVtbXktbm90LWEta2V5\n-----END ${label}-----`;

  it('fully masks a private-key PEM under an innocuous name in toCredentialField', () => {
    const f = toCredentialField('SERVER_CRT', pemBlock('RSA PRIVATE KEY'));
    expect(f.sensitive).toBe(true);
    expect(f.displayMasked).toBe('••••••••');
  });

  it('fully masks every private-key PEM variant in maskEnvValue', () => {
    for (const label of ['PRIVATE KEY', 'RSA PRIVATE KEY', 'EC PRIVATE KEY', 'OPENSSH PRIVATE KEY', 'ENCRYPTED PRIVATE KEY']) {
      expect(maskEnvValue('SSL_PEM', pemBlock(label))).toBe('••••••••');
    }
  });

  it('leaves a certificate PEM visible (public material)', () => {
    const cert = pemBlock('CERTIFICATE');
    expect(toCredentialField('CA_CERT', cert).sensitive).toBe(false);
    expect(maskEnvValue('CA_CERT', cert)).toBe(cert);
  });

  it('masks a private-key PEM leaf inside a nested object while its siblings stay readable', () => {
    const masked = maskEnvValue('VCAP_SERVICES', {
      svc: [{ credentials: { tls: pemBlock('EC PRIVATE KEY'), host: 'db.local' } }],
    }) as any;
    expect(masked.svc[0].credentials.tls).toBe('••••••••');
    expect(masked.svc[0].credentials.host).toBe('db.local');
  });
});
