import { signal, computed } from '@angular/core';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../src/features/applications/app-detail-data.service';

export class ApplicationServiceMock {
  static cfGuid = 'mockCfGuid';
  static appGuid = 'mockAppGuid';
  cfGuid = ApplicationServiceMock.cfGuid;
  appGuid = ApplicationServiceMock.appGuid;
}

/**
 * Minimal AppDetailDataService stub for the pages and cards that read the
 * detail signals; generateTestApplicationServiceProvider provides it beside
 * the real ApplicationService.
 */
export function makeAppDetailDataServiceStub() {
  const _loading = signal<Record<string, boolean>>({
    app: false, summary: false, stats: false, envVars: false,
    space: false, org: false, domains: false,
  });
  const _errors = signal<Record<string, any>>({
    app: null, summary: null, stats: null, envVars: null,
    space: null, org: null, domains: null,
  });
  return {
    app: signal<any>(undefined).asReadonly(),
    summary: signal<any>(undefined).asReadonly(),
    stats: signal<any[]>([]).asReadonly(),
    envVars: signal<any>(undefined).asReadonly(),
    space: signal<any>(undefined).asReadonly(),
    org: signal<any>(undefined).asReadonly(),
    domains: signal<any[]>([]).asReadonly(),
    loading: _loading.asReadonly(),
    errors: _errors.asReadonly(),
    running: computed(() => false),
    url: computed(() => null as string | null),
    // null means env vars not loaded.
    stratosProject: computed(() => null),
    state: computed(() => ({ label: '', indicator: null, actions: {} })),
    fetching: computed(() => false),
    lastPolledAt: signal<Date | null>(null).asReadonly(),
  };
}

export function generateTestApplicationServiceProvider(appGuid: string, cfGuid: string) {
  return [
    { provide: CF_GUID, useValue: cfGuid },
    { provide: APP_GUID, useValue: appGuid },
    {
      provide: AppDetailDataService,
      useFactory: makeAppDetailDataServiceStub,
    },
    {
      provide: ApplicationService,
      useFactory: () => new ApplicationService(),
    },
  ];
}


