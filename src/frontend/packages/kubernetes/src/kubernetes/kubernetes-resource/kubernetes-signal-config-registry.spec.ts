import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { SignalListConfig } from '@stratosui/core';

import {
  KubernetesSignalConfigContext,
  KubernetesSignalConfigRegistry,
} from './kubernetes-signal-config-registry';

describe('KubernetesSignalConfigRegistry', () => {
  let registry: KubernetesSignalConfigRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), KubernetesSignalConfigRegistry],
    });
    registry = TestBed.inject(KubernetesSignalConfigRegistry);
  });

  it('reports has() = false for unregistered types', () => {
    expect(registry.has('pod')).toBe(false);
    expect(registry.get('pod')).toBeUndefined();
  });

  it('register + has + get round-trips a factory', () => {
    const factory = (
      _ctx: KubernetesSignalConfigContext,
      _inj: Injector,
    ) => ({} as SignalListConfig<unknown>);
    registry.register('pod', factory);

    expect(registry.has('pod')).toBe(true);
    expect(registry.get('pod')).toBe(factory);
  });

  it('unregister removes the factory', () => {
    registry.register('pod', () => ({} as SignalListConfig<unknown>));
    expect(registry.has('pod')).toBe(true);
    registry.unregister('pod');
    expect(registry.has('pod')).toBe(false);
  });

  it('overwriting a key replaces the factory', () => {
    const a = () => ({ key: 'a' } as unknown as SignalListConfig<unknown>);
    const b = () => ({ key: 'b' } as unknown as SignalListConfig<unknown>);
    registry.register('pod', a);
    registry.register('pod', b);
    expect(registry.get('pod')).toBe(b);
  });

  it('factory receives ctx + injector and returns a SignalListConfig', () => {
    const captured: { ctx?: KubernetesSignalConfigContext; injector?: Injector } = {};
    const ns = signal<string | undefined>(undefined);
    registry.register('service', (ctx, injector) => {
      captured.ctx = ctx;
      captured.injector = injector;
      return { columns: [] } as unknown as SignalListConfig<unknown>;
    });

    const ctx: KubernetesSignalConfigContext = {
      kubeGuid: 'cluster-1',
      selectedNamespace: ns.asReadonly(),
      isWorkloadView: false,
    };
    const result = registry.get('service')!(ctx, TestBed.inject(Injector));
    expect(captured.ctx).toBe(ctx);
    expect(captured.injector).toBeDefined();
    expect(result).toBeTruthy();
  });
});
