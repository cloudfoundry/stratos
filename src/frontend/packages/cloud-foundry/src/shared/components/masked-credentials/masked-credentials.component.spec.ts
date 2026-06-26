import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { MaskedCredentialsComponent, toCredentialFields } from './masked-credentials.component';

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
