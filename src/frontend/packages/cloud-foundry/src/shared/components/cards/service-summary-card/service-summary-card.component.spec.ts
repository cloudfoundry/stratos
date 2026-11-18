import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { StServiceOffering } from '../../../../services/endpoint-data/stratos-types';
import { ServiceSummaryCardComponent } from './service-summary-card.component';

const offeringFixture: StServiceOffering = {
  guid: 'svc-1',
  cnsiGuid: 'cnsi-1',
  name: 'app-autoscaler',
  description: 'Shared service for app-autoscaler',
  tags: ['simple', 'shared'],
  available: true,
  shareable: false,
  documentationUrl: 'https://example.com/docs',
  createdAt: '2017-11-27T17:07:02Z',
};

describe('ServiceSummaryCardComponent', () => {
  let component: ServiceSummaryCardComponent;
  let fixture: ComponentFixture<ServiceSummaryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceSummaryCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ServiceSummaryCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The documentation link showed only an icon (WCAG 2.4.4): it is named.
  it('names the documentation link', async () => {
    fixture.componentRef.setInput('offering', offeringFixture);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('a[href="https://example.com/docs"]') as HTMLAnchorElement;
    expect(link.getAttribute('aria-label')).toBe('Documentation');
  });

  it('renders the offering description and tags when an offering is bound', async () => {
    fixture.componentRef.setInput('offering', offeringFixture);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Shared service for app-autoscaler');
    expect(host.textContent).toContain('simple');
    expect(host.textContent).toContain('shared');
  });
});
