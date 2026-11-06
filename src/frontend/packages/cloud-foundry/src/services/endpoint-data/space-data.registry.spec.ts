import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpaceDataRegistry } from './space-data.registry';

describe('SpaceDataRegistry', () => {
  let registry: SpaceDataRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        SpaceDataRegistry,
      ],
    });
    registry = TestBed.inject(SpaceDataRegistry);
  });

  it('returns same instance for same (cnsi,space)', () => {
    const a = registry.acquire('cnsi-1', 'sp-1');
    const b = registry.acquire('cnsi-1', 'sp-1');
    expect(a).toBe(b);
  });

  it('returns different instances for different spaces', () => {
    const a = registry.acquire('cnsi-1', 'sp-1');
    const b = registry.acquire('cnsi-1', 'sp-2');
    expect(a).not.toBe(b);
  });

  it('different cnsi same space → different instances', () => {
    const a = registry.acquire('cnsi-1', 'sp-1');
    const b = registry.acquire('cnsi-2', 'sp-1');
    expect(a).not.toBe(b);
  });

  it('retains instance after release (sticky)', () => {
    const svc = registry.acquire('cnsi-1', 'sp-1');
    registry.release('cnsi-1', 'sp-1');
    expect(registry.acquire('cnsi-1', 'sp-1')).toBe(svc);
  });

  it('evict() removes the instance', () => {
    const svc = registry.acquire('cnsi-1', 'sp-1');
    registry.evict('cnsi-1', 'sp-1');
    expect(registry.acquire('cnsi-1', 'sp-1')).not.toBe(svc);
  });
});
