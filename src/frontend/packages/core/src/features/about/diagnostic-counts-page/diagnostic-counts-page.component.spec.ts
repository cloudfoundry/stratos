import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { EndpointModel } from '@stratosui/store';
import { CoreTestingModule, createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import { beforeEach, describe, expect, it } from 'vitest';

import { EndpointsSignalService } from '../../../core/signals/endpoints-signal.service';
import { TabNavService } from '../../../tab-nav.service';
import { DiagnosticCountsPageComponent } from './diagnostic-counts-page.component';

const cfEndpoint = {
  guid: 'cf-1',
  name: 'My Cloud Foundry',
  cnsi_type: 'cf',
} as EndpointModel;

const nonCfEndpoint = {
  guid: 'k8s-1',
  name: 'My Kube',
  cnsi_type: 'k8s',
} as EndpointModel;

describe('DiagnosticCountsPageComponent', () => {
  let fixture: ComponentFixture<DiagnosticCountsPageComponent>;
  let httpMock: HttpTestingController;

  const countsUrl = (resource: string) => `/pp/v1/cf/${resource}/cf-1?return=counts`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        DiagnosticCountsPageComponent,
      ],
      providers: [
        TabNavService,
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        {
          provide: EndpointsSignalService,
          useValue: {
            connectedEndpoints: signal<EndpointModel[]>([cfEndpoint, nonCfEndpoint]),
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DiagnosticCountsPageComponent);
    fixture.detectChanges();
  });

  function flushProbes(overrides: Record<string, number | 'error'> = {}) {
    const defaults: Record<string, number | 'error'> = {
      users: 12,
      orgs: 3,
      spaces: 7,
      apps: 42,
      routes: 55,
      service_instances: 9,
      ...overrides,
    };
    for (const [resource, value] of Object.entries(defaults)) {
      const req = httpMock.expectOne(countsUrl(resource));
      expect(req.request.method).toBe('GET');
      if (value === 'error') {
        req.flush('boom', { status: 500, statusText: 'Server Error' });
      } else {
        req.flush({ totalResults: value });
      }
    }
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    flushProbes();
  });

  it('probes counts only for connected CF endpoints', () => {
    flushProbes();
    // No probes for the non-CF endpoint.
    httpMock.expectNone(`/pp/v1/cf/users/k8s-1?return=counts`);
    httpMock.verify();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('My Cloud Foundry');
    expect(text).not.toContain('My Kube');
  });

  it('renders counts and footprint estimates per entity type', () => {
    flushProbes();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Organizations');
    expect(text).toContain('42'); // apps count
    expect(text).toContain('55'); // routes count
    // 42 apps x 1300 B x 1.5 = 81,900 B -> "80.0 kB"
    expect(text).toContain('80.0 kB');
  });

  it('renders a failed probe as unavailable, not zero', () => {
    flushProbes({ spaces: 'error' });
    const rows: HTMLTableRowElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr'));
    const spacesRow = rows.find(r => r.textContent!.includes('Spaces'));
    expect(spacesRow).toBeTruthy();
    expect(spacesRow!.textContent).toContain('Unavailable');
    expect(spacesRow!.textContent).not.toContain('0');
  });

  it('shows guidance when the users row is high risk', () => {
    // 10M users -> ~27 GB estimate -> high risk under any heap reading.
    flushProbes({ users: 10_000_000 });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('High');
    expect(text.toLowerCase()).toContain('cf cli');
  });

  it('shows a heap context line', () => {
    flushProbes();
    const text = fixture.nativeElement.textContent;
    expect(text).toMatch(/performance\.memory|fixed budget/);
  });

  it('re-probes all endpoints on refresh', () => {
    flushProbes();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[name="refresh"]');
    expect(button).toBeTruthy();
    button.click();
    fixture.detectChanges();
    flushProbes({ apps: 100 });
    expect(fixture.nativeElement.textContent).toContain('100');
    httpMock.verify();
  });
});
