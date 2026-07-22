import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EndpointsDataService } from '@stratosui/store';

import { DiagnosticProbesPageComponent } from './diagnostic-probes-page.component';

const SYSTEM_INFO_URL = '/pp/v1/info';
const PROBE_URL = '/pp/v1/cf/diag/urilimit/cf-1';

const systemInfo = {
  version: { proxy_version: 'test', database_version: 1 },
  user: { guid: 'u1', name: 'admin', admin: true },
  endpoints: {
    cf: {
      'cf-1': {
        guid: 'cf-1', name: 'cf-one', cnsi_type: 'cf',
        api_endpoint: { Scheme: 'https', Host: 'api.example.com' },
        user: { guid: 'u1', name: 'admin', admin: true },
        system_shared_token: false, sso_allowed: false, metricsAvailable: false,
        creator: { name: 'admin', admin: true, system: false },
      },
    },
  },
};

const probeResult = {
  probedLimitBytes: 8064, cappedAtMax: false,
  configuredChunk: 150, effectiveChunk: 150, configuredBytes: 5850,
  adaptive: false, recommendedChunk: 200, probeRequests: 11,
};

describe('DiagnosticProbesPageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EndpointsDataService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function createHydrated() {
    const svc = TestBed.inject(EndpointsDataService);
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(systemInfo);
    await p;
    const fixture = TestBed.createComponent(DiagnosticProbesPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a probe row per CF endpoint with a run button', async () => {
    const fixture = await createHydrated();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="probe-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('cf-one');
    expect(rows[0].textContent).toContain('https://api.example.com');
    expect(fixture.nativeElement.querySelector('[data-test="probe-run"]')).not.toBeNull();
  });

  it('probe click calls the backend and renders probed-vs-configured with headroom verdict', async () => {
    const fixture = await createHydrated();
    const done = fixture.componentInstance.probe('cf-1');
    httpMock.expectOne(PROBE_URL).flush(probeResult);
    await done;
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('[data-test="probe-result"]');
    expect(result).not.toBeNull();
    expect(result.textContent).toContain('8,064');
    expect(result.textContent).toContain('STRATOS_CF_GUID_CHUNK=150');
    expect(fixture.nativeElement.querySelector('[data-test="probe-verdict-headroom"]')?.textContent)
      .toContain('STRATOS_CF_GUID_CHUNK=200');
  });

  it('warns to lower the setting when the configured budget exceeds the probed ceiling', async () => {
    const fixture = await createHydrated();
    const done = fixture.componentInstance.probe('cf-1');
    httpMock.expectOne(PROBE_URL).flush({ ...probeResult, probedLimitBytes: 4096, recommendedChunk: 78 });
    await done;
    fixture.detectChanges();
    const verdict = fixture.nativeElement.querySelector('[data-test="probe-verdict-lower"]');
    expect(verdict).not.toBeNull();
    expect(verdict.textContent).toContain('STRATOS_CF_GUID_CHUNK=78');
  });

  it('surfaces a probe failure without wedging the button', async () => {
    const fixture = await createHydrated();
    const done = fixture.componentInstance.probe('cf-1');
    httpMock.expectOne(PROBE_URL).flush({ detail: 'probe failed: endpoint unreachable' }, { status: 502, statusText: 'Bad Gateway' });
    await done;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="probe-error"]')).not.toBeNull();
    expect(fixture.componentInstance.stateFor('cf-1').running).toBe(false);
  });
});
