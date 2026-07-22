import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { CfInfoDataRegistry } from './cf-info-data.registry';

describe('CfInfoDataRegistry', () => {
  let registry: CfInfoDataRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CfInfoDataRegistry,
      ],
    });
    registry = TestBed.inject(CfInfoDataRegistry);
  });

  it('returns same instance for same cnsiGuid', () => {
    expect(registry.acquire('cnsi-1')).toBe(registry.acquire('cnsi-1'));
  });

  it('returns different instances for different cnsis', () => {
    expect(registry.acquire('cnsi-1')).not.toBe(registry.acquire('cnsi-2'));
  });

  it('retains instance after release (sticky)', () => {
    const svc = registry.acquire('cnsi-1');
    registry.release('cnsi-1');
    expect(registry.acquire('cnsi-1')).toBe(svc);
  });

  it('evict() removes the instance', () => {
    const svc = registry.acquire('cnsi-1');
    registry.evict('cnsi-1');
    expect(registry.acquire('cnsi-1')).not.toBe(svc);
  });
});
