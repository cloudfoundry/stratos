import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CfAppsSignalConfigService } from './cf-apps-signal-config.service';

describe('CfAppsSignalConfigService', () => {
  it('constructs one CnsiAppsSource per connected CF in scope', () => {
    const http = { get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } } })) } as unknown as HttpClient;
    const svc = new CfAppsSignalConfigService(http);
    svc.initialize(['cnsi-1', 'cnsi-2']);
    expect(svc.orchestrator.sources.map(s => s.cnsiGuid)).toEqual(['cnsi-1', 'cnsi-2']);
  });

  it('exposes a ViewPipeline with filter / sort / pagination signals', () => {
    const http = { get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } } })) } as unknown as HttpClient;
    const svc = new CfAppsSignalConfigService(http);
    svc.initialize(['cnsi-1']);
    expect(svc.view).toBeDefined();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
  });
});
