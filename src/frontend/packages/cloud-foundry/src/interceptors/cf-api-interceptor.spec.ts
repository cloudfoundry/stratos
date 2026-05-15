import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EndpointsSignalService } from '@stratosui/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { StratosDiagnostics } from '../services/diagnostics/stratos-diagnostics.service';
import { cfApiInterceptor } from './cf-api-interceptor';

// Minimal EndpointsSignalService stub — the interceptor only reads
// `endpoints()` to look up a name for the 502 snackbar. An empty map is
// enough for the existing tests; the snackbar-naming regression test below
// pre-populates a single endpoint via the same stub.
const endpointsStub = {
  endpoints: signal<Record<string, { name?: string }>>({}),
};

describe('cfApiInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let diagnostics: StratosDiagnostics;

  beforeEach(() => {
    endpointsStub.endpoints.set({});
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cfApiInterceptor])),
        provideHttpClientTesting(),
        { provide: EndpointsSignalService, useValue: endpointsStub },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    diagnostics = TestBed.inject(StratosDiagnostics);
    diagnostics.reset();
  });

  it('emits api-call-count on successful response', async () => {
    http.get('/pp/v1/cf/orgs/cf-1').subscribe();
    ctrl.expectOne('/pp/v1/cf/orgs/cf-1').flush({});
    await diagnostics.waitForFlush();
    const counters = diagnostics.snapshot().counters['api-call-count'] ?? [];
    const match = counters.find(c => String(c.dimensions.urlPattern).includes('/cf/orgs'));
    expect(match?.count).toBe(1);
    expect(match?.dimensions.method).toBe('GET');
  });

  it('emits api-call-timing sample with durationMs', async () => {
    http.get('/pp/v1/cf/orgs/cf-1').subscribe();
    ctrl.expectOne('/pp/v1/cf/orgs/cf-1').flush({});
    await diagnostics.waitForFlush();
    const samples = diagnostics.snapshot().samples['api-call-timing'] ?? [];
    expect(samples).toHaveLength(1);
    expect(typeof samples[0].value).toBe('number');
    expect(samples[0].value ?? -1).toBeGreaterThanOrEqual(0);
  });

  it('normalizes GUIDs in url patterns so cross-cnsi paths aggregate', async () => {
    http.get('/pp/v1/cf/org/abc12345-1234-5678-9abc-def012345678/foo').subscribe();
    ctrl.expectOne('/pp/v1/cf/org/abc12345-1234-5678-9abc-def012345678/foo').flush({});
    await diagnostics.waitForFlush();
    const counters = diagnostics.snapshot().counters['api-call-count'] ?? [];
    const pattern = String(counters[0]?.dimensions.urlPattern);
    expect(pattern).toContain('/:guid');
    expect(pattern).not.toContain('abc12345-1234-5678-9abc-def012345678');
  });

  it('tags errors with outcome=error', async () => {
    http.get('/pp/v1/cf/orgs/cf-1').subscribe({ error: () => undefined });
    ctrl.expectOne('/pp/v1/cf/orgs/cf-1').error(new ProgressEvent('Network error'));
    await diagnostics.waitForFlush();
    const counters = diagnostics.snapshot().counters['api-call-count'] ?? [];
    const errMatch = counters.find(c => c.dimensions.outcome === 'error');
    expect(errMatch?.count).toBe(1);
  });

  // Regression for the snackbar identifying the failing endpoint by name.
  // The first cut of the 502 handler said only "Cloud Foundry endpoint
  // authentication expired" — operators with multiple CF endpoints could
  // not tell which one needed reconnecting. Snackbar text must include the
  // endpoint name and the GUID (the latter as a tail-end disambiguator for
  // the case where two endpoints share a display name).
  it('includes endpoint name and GUID in the 502 snackbar message', async () => {
    const cnsi = 'CSnSysOkvwBD6A-UQyQW6gmKPhI';
    endpointsStub.endpoints.set({ [cnsi]: { name: 'Kevin' } });
    const messages: string[] = [];
    const { TailwindSnackBarService } = await import('@stratosui/core');
    const snackbar = TestBed.inject(TailwindSnackBarService);
    const origError = snackbar.error.bind(snackbar);
    snackbar.error = (msg: string, action?: string) => {
      messages.push(msg);
      return origError(msg, action);
    };

    http.get(`/pp/v1/cf/info/${cnsi}`).subscribe({ error: () => undefined });
    ctrl.expectOne(`/pp/v1/cf/info/${cnsi}`).flush(
      'Bad Gateway',
      { status: 502, statusText: 'Bad Gateway' },
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("'Kevin'");
    expect(messages[0]).toContain(cnsi);
  });

  // Regression for the desktop-plugin cnsi GUID format. Endpoints registered
  // via plugins/desktop/{endpoints,kubernetes,helm}/endpoints.go encode the
  // cnsi GUID as base64.RawURLEncoding(sha256(...)) — mixed-case alphanumeric
  // plus '-' / '_'. The first cut of CNSI_GUID_RE used [0-9a-f-]{36} only and
  // dropped these endpoints on the floor, so 502 InvalidAuthToken responses
  // never marked the endpoint stale. Both formats must collapse to /:guid.
  it.each([
    ['hex UUID', '/pp/v1/cf/spaces/abc12345-1234-5678-9abc-def012345678'],
    ['base64url cnsi', '/pp/v1/cf/spaces/CSnSysoBD6A-UQyQW6gmKPhI8FT1ZxZxZ'],
  ])('normalizes %s cnsi to /:guid in url pattern', async (_label, url) => {
    http.get(url).subscribe();
    ctrl.expectOne(url).flush({});
    await diagnostics.waitForFlush();
    const counters = diagnostics.snapshot().counters['api-call-count'] ?? [];
    const pattern = String(counters[0]?.dimensions.urlPattern);
    expect(pattern).toBe('/pp/v1/cf/spaces/:guid');
  });
});
