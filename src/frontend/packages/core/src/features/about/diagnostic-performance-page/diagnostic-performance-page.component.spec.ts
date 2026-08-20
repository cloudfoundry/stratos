import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { LoadReport, buildLoadReport, reportToJson, reportToMarkdown } from '../diagnostics-data/load-performance';
import { DiagnosticPerformancePageComponent, resetSavedLoadReport } from './diagnostic-performance-page.component';

const { fixedReport } = vi.hoisted(() => {
  const fixedReport: LoadReport = {
    collectedAt: '2026-07-03T00:00:00.000Z',
    topology: 'cf-pushed',
    requestId: 'req-abc-123',
    protocol: 'h2',
    requestStartMs: 10,
    responseStartMs: 12,
    domContentLoadedMs: 300,
    loadEventMs: 500,
    firstContentfulPaintMs: 250,
    lcpMs: null,
    lcpElement: null,
    requestCount: 2,
    totalTransferBytes: 4096,
    initialRequestCount: 1,
    initialTransferBytes: 3000,
    sinceLoadRequestCount: 1,
    sinceLoadTransferBytes: 1096,
    phases: { stalledMs: 5, dnsMs: 1, tcpMs: 2, tlsMs: 3, serverWaitMs: 1 },
    resources: [
      { path: '/main.js', startMs: 1, durationMs: 20, transferBytes: 3000, decodedBytes: 9000, protocol: 'h2', cached: false },
      { path: '/styles.css', startMs: 2, durationMs: 5, transferBytes: 1096, decodedBytes: 2000, protocol: 'h2', cached: true },
    ],
  };
  return { fixedReport };
});

vi.mock('../diagnostics-data/load-performance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../diagnostics-data/load-performance')>();
  return {
    ...actual,
    buildLoadReport: vi.fn(async () => fixedReport),
  };
});

describe('DiagnosticPerformancePageComponent', () => {
  let component: DiagnosticPerformancePageComponent;
  let fixture: ComponentFixture<DiagnosticPerformancePageComponent>;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resetSavedLoadReport();
    vi.mocked(buildLoadReport).mockClear();
    writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        DiagnosticPerformancePageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosticPerformancePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the topology with the request id', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('cf-pushed');
    expect(text).toContain('req-abc-123');
  });

  it('renders "n/a" for a null LCP', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('n/a');
  });

  it('renders resource paths in the resource table', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('/main.js');
    expect(text).toContain('/styles.css');
  });

  it('copies the markdown report to the clipboard', async () => {
    const button = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="copy-markdown"]');
    expect(button).toBeTruthy();
    button?.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(reportToMarkdown(fixedReport));
  });

  it('headlines the initial-load totals with the since-load overflow alongside', () => {
    const el = fixture.nativeElement as HTMLElement;
    const requests = el.querySelector('[data-test="requests-summary"]')?.textContent ?? '';
    expect(requests).toContain('1');
    expect(requests).toContain('+1 since load');
    const transfer = el.querySelector('[data-test="transfer-summary"]')?.textContent ?? '';
    expect(transfer).toContain('+');
    expect(transfer).toContain('since load');
  });

  it('shows each milestone on the Stratos clock next to the browser clock', () => {
    const appClock = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-test="app-clock-response"]')?.textContent ?? '';
    // responseStartMs 12 − requestStartMs 10
    expect(appClock).toContain('2 ms');
  });

  it('breaks the pre-response time into document fetch phases', () => {
    const phases = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-test="doc-phases"]')?.textContent ?? '';
    expect(phases).toContain('stalled 5 ms');
    expect(phases).toContain('TLS 3 ms');
    expect(phases).toContain('server wait 1 ms');
  });

  it('shows the cold/warm cache verdict for the load', () => {
    const verdict = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-test="cache-verdict"]')?.textContent ?? '';
    // fixedReport has 1 of 2 resources cached — the warm boundary.
    expect(verdict).toContain('warm');
    expect(verdict).toContain('50% cached');
  });

  it('re-displays the saved report immediately and re-measures on re-entry', async () => {
    expect(vi.mocked(buildLoadReport)).toHaveBeenCalledTimes(1);

    const second = TestBed.createComponent(DiagnosticPerformancePageComponent);
    second.detectChanges();
    // The saved report shows before the fresh measurement resolves.
    expect(second.componentInstance.report()).toEqual(fixedReport);
    await second.whenStable();

    expect(vi.mocked(buildLoadReport)).toHaveBeenCalledTimes(2);
    expect(second.componentInstance.report()).toEqual(fixedReport);
  });

  it('wires the reload button to a document reload', () => {
    const reload = vi.spyOn(component, 'reload').mockImplementation(() => undefined);
    const button = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="reload-measure"]');
    expect(button?.textContent).toContain('Reload & measure');
    button?.click();
    expect(reload).toHaveBeenCalled();
  });

  it('copies the JSON report to the clipboard', async () => {
    const button = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="copy-json"]');
    expect(button).toBeTruthy();
    button?.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(reportToJson(fixedReport));
  });
});
