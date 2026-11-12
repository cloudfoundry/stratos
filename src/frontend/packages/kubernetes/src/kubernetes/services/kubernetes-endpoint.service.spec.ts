import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { SessionService } from '../../../../core/src/core/session.service';
import { EndpointModel, EndpointsDataService } from '../../../../store/src/public-api';
import { BaseKubeGuid } from '../kubernetes-page.types';
import {
  KubeDashboardStatus,
  KubernetesEndpointService,
  kubeDashboardConfigured,
  kubeDashboardLabel,
} from './kubernetes-endpoint.service';

describe('KubernetesEndpointService', () => {
  const endpoints = signal(new Map<string, EndpointModel>());
  const whenReady = vi.fn(() => new Promise<void>(() => undefined));

  // The backend sends each plugin flag under its own key
  // (jetstream plugins/kubernetes main.go).
  const create = (pluginConfig: Record<string, string>) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: BaseKubeGuid, useValue: { guid: 'kube-1' } },
        { provide: SessionService, useValue: { sessionData: signal({ 'plugin-config': pluginConfig }) } },
        { provide: HttpClient, useValue: { get: () => of(null) } },
        { provide: EndpointsDataService, useValue: { endpoints, whenReady } },
      ],
    });
    return TestBed.inject(KubernetesEndpointService);
  };

  it('kubeDashboardEnabled follows the dashboard flag, not the terminal flag', () => {
    const service = create({ kubeDashboardEnabled: 'true', kubeTerminalEnabled: 'false' });

    expect(service.kubeDashboardEnabled()).toBe(true);
    expect(service.kubeTerminalEnabled()).toBe(false);
  });

  it('kubeDashboardEnabled is off when only the terminal is enabled', () => {
    const service = create({ kubeDashboardEnabled: 'false', kubeTerminalEnabled: 'true' });

    expect(service.kubeDashboardEnabled()).toBe(false);
    expect(service.kubeTerminalEnabled()).toBe(true);
  });

  it('reads the endpoint from the endpoints map, loading the map when it lacks it', () => {
    endpoints.set(new Map());
    whenReady.mockClear();
    const service = create({});
    expect(whenReady).toHaveBeenCalledTimes(1);
    expect(service.endpoint()).toBeUndefined();

    endpoints.set(new Map([['kube-1', { guid: 'kube-1', name: 'kube' } as EndpointModel]]));
    expect(service.endpoint()?.name).toBe('kube');
  });

  it('labels the dashboard by how far it is set up', () => {
    const status = (s: Partial<KubeDashboardStatus>) => s as KubeDashboardStatus;
    expect(kubeDashboardLabel(null)).toBe('');
    expect(kubeDashboardLabel(status({ installed: false }))).toBe('Not installed');
    expect(kubeDashboardLabel(status({ installed: true }))).toBe('Not configured');
    expect(kubeDashboardLabel(status({ installed: true, serviceAccount: {}, version: '2.0' }))).toBe('2.0');
    expect(kubeDashboardConfigured(status({ installed: true, serviceAccount: {} }))).toBe(false);
    expect(kubeDashboardConfigured(status({ installed: true, serviceAccount: {}, service: {} as any }))).toBe(true);
  });
});
