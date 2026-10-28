import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { EndpointCertificatesComponent } from './endpoint-certificates.component';
import { CertificateSummary, certificateState, worstCertificateState } from './endpoint-certificates.service';

const DAY = 86_400_000;
const NOW = new Date('2026-10-28T12:00:00Z');

function cert(offsetDays: number, extra: Partial<CertificateSummary> = {}): CertificateSummary {
  return {
    subject: 'CN=Test CA,O=Example',
    issuer: 'CN=Root',
    not_before: new Date(NOW.getTime() - 100 * DAY).toISOString(),
    not_after: new Date(NOW.getTime() + offsetDays * DAY).toISOString(),
    sha256: 'AB:CD',
    ...extra,
  };
}

describe('certificateState', () => {
  it('is ok with 31 days left', () => {
    expect(certificateState(cert(31), NOW).state).toBe('ok');
  });
  it('is expiring at 30 days', () => {
    expect(certificateState(cert(30), NOW)).toEqual({ state: 'expiring', days: 30 });
  });
  it('is expired 12 days ago', () => {
    expect(certificateState(cert(-12), NOW)).toEqual({ state: 'expired', days: 12 });
  });
  it('is expired today when it ended earlier today', () => {
    const c = cert(0, { not_after: '2026-10-28T03:00:00Z' });
    expect(certificateState(c, NOW)).toEqual({ state: 'expired', days: 0 });
  });
});

describe('worstCertificateState', () => {
  it('is null for an empty list', () => {
    expect(worstCertificateState([], NOW)).toBeNull();
  });
  it('ranks expired over expiring over ok', () => {
    expect(worstCertificateState([cert(90), cert(5)], NOW)).toBe('expiring');
    expect(worstCertificateState([cert(90), cert(5), cert(-1)], NOW)).toBe('expired');
    expect(worstCertificateState([cert(90)], NOW)).toBe('ok');
  });
});

describe('EndpointCertificatesComponent', () => {
  let fixture: ComponentFixture<EndpointCertificatesComponent>;
  let http: HttpTestingController;
  const DECODE = '/api/v1/endpoints/certificates/decode';

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await TestBed.configureTestingModule({
      imports: [EndpointCertificatesComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EndpointCertificatesComponent);
  });

  afterEach(() => vi.useRealTimers());

  async function setInputs(pem: string, guid: string | null = null) {
    fixture.componentRef.setInput('pem', pem);
    fixture.componentRef.setInput('endpointGuid', guid);
    await fixture.whenStable();
    await vi.advanceTimersByTimeAsync(300);
  }

  async function flushDecode(body: object, status = 200) {
    http.expectOne(DECODE).flush(body, { status, statusText: status === 200 ? 'OK' : 'Bad Request' });
    await vi.advanceTimersByTimeAsync(0);
    await fixture.whenStable();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('renders one card per certificate', async () => {
    await setInputs('PEM');
    const soon = new Date(Date.now() + 21 * DAY + 3_600_000).toISOString();
    await flushDecode([cert(300), cert(21, { not_after: soon })]);
    const cards = el().querySelectorAll('[data-testid="cert-card"]');
    expect(cards.length).toBe(2);
    expect(cards[1].textContent).toContain('Expires in 21 days');
    expect(cards[0].textContent).toContain('CN=Test CA,O=Example');
    expect(cards[0].querySelector('.font-mono')?.textContent).toContain('AB:CD');
  });

  it('shows the decode error', async () => {
    await setInputs('junk');
    await flushDecode({ status: 'error', error: 'No certificate found' }, 400);
    expect(el().textContent).toContain('No certificate found');
    expect(el().querySelectorAll('[data-testid="cert-card"]').length).toBe(0);
  });

  it('does not request when the PEM is empty', async () => {
    await setInputs('');
    http.expectNone(DECODE);
  });

  it('runs the trust check only when asked', async () => {
    await setInputs('PEM', 'guid-1');
    await flushDecode([cert(300)]);
    http.expectNone('/api/v1/endpoints/guid-1/trust');
    const button = Array.from(el().querySelectorAll('button')).find(b => b.textContent?.includes('Check trust now'))!;
    button.click();
    await fixture.whenStable();
    const req = http.expectOne('/api/v1/endpoints/guid-1/trust');
    expect((req.request.body as FormData).get('ca_cert')).toBe('PEM');
    req.flush([
      { host: 'api.x', trusted: true },
      { host: 'uaa.x', trusted: false, reason: 'unknown authority' },
    ]);
    await vi.advanceTimersByTimeAsync(0);
    await fixture.whenStable();
    expect(el().textContent).toContain('✓ api.x: trusted');
    expect(el().textContent).toContain('✗ uaa.x: unknown authority');
    expect(el().textContent).toContain('Results are not saved.');
  });

  // The results answer for the PEM checked; another PEM needs its own check.
  describe('when the PEM changes', () => {
    const checkNow = () => Array.from(el().querySelectorAll('button')).find(b => b.textContent?.includes('Check trust now'))!;

    it('clears the trust results', async () => {
      await setInputs('PEM', 'guid-1');
      await flushDecode([cert(300)]);
      checkNow().click();
      await fixture.whenStable();
      http.expectOne('/api/v1/endpoints/guid-1/trust').flush([{ host: 'api.x', trusted: true }]);
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();
      expect(el().textContent).toContain('✓ api.x: trusted');

      await setInputs('PEM2', 'guid-1');
      await flushDecode([cert(300)]);
      expect(el().textContent).not.toContain('api.x');
      expect(el().textContent).not.toContain('Results are not saved.');
    });

    it('clears a trust check error', async () => {
      await setInputs('PEM', 'guid-1');
      await flushDecode([cert(300)]);
      checkNow().click();
      await fixture.whenStable();
      http.expectOne('/api/v1/endpoints/guid-1/trust')
        .flush({ status: 'error', error: 'Endpoint not found' }, { status: 404, statusText: 'Not Found' });
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();
      expect(el().textContent).toContain('Endpoint not found');

      await setInputs('PEM2', 'guid-1');
      await flushDecode([cert(300)]);
      expect(el().textContent).not.toContain('Endpoint not found');
    });

    it('drops the answer to a check of the earlier PEM', async () => {
      await setInputs('PEM', 'guid-1');
      await flushDecode([cert(300)]);
      checkNow().click();
      await fixture.whenStable();
      const req = http.expectOne('/api/v1/endpoints/guid-1/trust');

      await setInputs('PEM2', 'guid-1');
      await flushDecode([cert(300)]);
      req.flush([{ host: 'api.x', trusted: true }]);
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();
      expect(el().textContent).not.toContain('api.x');
    });
  });

  it('hides Check trust now without an endpoint', async () => {
    await setInputs('PEM', null);
    await flushDecode([cert(300)]);
    expect(el().textContent).not.toContain('Check trust now');
  });

  it('emits the worst state', async () => {
    const seen: unknown[] = [];
    fixture.componentInstance.worstState.subscribe(s => seen.push(s));
    await setInputs('PEM');
    await flushDecode([cert(300), cert(-3)]);
    expect(seen.at(-1)).toBe('expired');
  });
});
