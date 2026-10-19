import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { SessionService } from '../../../../core/src/core/session.service';
import { EndpointsDataService } from '../../../../store/src/public-api';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

describe('KubernetesEndpointService', () => {
  // The backend sends each plugin flag under its own key
  // (jetstream plugins/kubernetes main.go).
  const create = (pluginConfig: Record<string, string>) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: BaseKubeGuid, useValue: { guid: 'kube-1' } },
        { provide: SessionService, useValue: { sessionData: signal({ 'plugin-config': pluginConfig }) } },
        { provide: HttpClient, useValue: { get: () => of(null) } },
        { provide: EndpointsDataService, useValue: { waitFor: () => new Promise(() => undefined) } },
      ],
    });
    return TestBed.inject(KubernetesEndpointService);
  };

  it('kubeDashboardEnabled$ follows the dashboard flag, not the terminal flag', async () => {
    const service = create({ kubeDashboardEnabled: 'true', kubeTerminalEnabled: 'false' });

    expect(await firstValueFrom(service.kubeDashboardEnabled$)).toBe(true);
    expect(await firstValueFrom(service.kubeTerminalEnabled$)).toBe(false);
  });

  it('kubeDashboardEnabled$ is off when only the terminal is enabled', async () => {
    const service = create({ kubeDashboardEnabled: 'false', kubeTerminalEnabled: 'true' });

    expect(await firstValueFrom(service.kubeDashboardEnabled$)).toBe(false);
    expect(await firstValueFrom(service.kubeTerminalEnabled$)).toBe(true);
  });
});
