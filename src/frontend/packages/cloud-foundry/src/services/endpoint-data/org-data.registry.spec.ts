import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { OrgDataRegistry } from './org-data.registry';

describe('OrgDataRegistry', () => {
  let registry: OrgDataRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        OrgDataRegistry,
      ],
    });
    registry = TestBed.inject(OrgDataRegistry);
  });

  it('returns same service instance on repeated acquire() for same (cnsi,org)', () => {
    const svc1 = registry.acquire('cnsi-1', 'org-a');
    const svc2 = registry.acquire('cnsi-1', 'org-a');
    expect(svc1).toBe(svc2);
    registry.release('cnsi-1', 'org-a');
    registry.release('cnsi-1', 'org-a');
  });

  it('returns different instances for different orgs in same cnsi', () => {
    const a = registry.acquire('cnsi-1', 'org-a');
    const b = registry.acquire('cnsi-1', 'org-b');
    expect(a).not.toBe(b);
  });

  it('returns different instances for same org guid across cnsis', () => {
    const a = registry.acquire('cnsi-1', 'org-a');
    const b = registry.acquire('cnsi-2', 'org-a');
    expect(a).not.toBe(b);
  });

  it('retains instance after full release (sticky data)', () => {
    const svc = registry.acquire('cnsi-1', 'org-a');
    registry.release('cnsi-1', 'org-a');
    const svcAgain = registry.acquire('cnsi-1', 'org-a');
    expect(svc).toBe(svcAgain);
  });

  it('evict() removes the instance', () => {
    const svc = registry.acquire('cnsi-1', 'org-a');
    registry.evict('cnsi-1', 'org-a');
    const svcAfter = registry.acquire('cnsi-1', 'org-a');
    expect(svc).not.toBe(svcAfter);
  });

  it('peek() returns the cached instance without creating one', () => {
    expect(registry.peek('cnsi-1', 'org-a')).toBeUndefined();
    const svc = registry.acquire('cnsi-1', 'org-a');
    expect(registry.peek('cnsi-1', 'org-a')).toBe(svc);
  });

  it('peekByCnsi() returns every cached instance for the endpoint only', () => {
    const a = registry.acquire('cnsi-1', 'org-a');
    const b = registry.acquire('cnsi-1', 'org-b');
    registry.acquire('cnsi-2', 'org-a');
    expect(registry.peekByCnsi('cnsi-1')).toEqual([a, b]);
    expect(registry.peekByCnsi('cnsi-3')).toEqual([]);
  });
});
