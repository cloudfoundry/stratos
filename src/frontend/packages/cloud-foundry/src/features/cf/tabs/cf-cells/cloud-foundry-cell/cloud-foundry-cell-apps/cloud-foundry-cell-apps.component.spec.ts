import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { ActiveRouteCfCell, generateCFEntities } from '@test-framework/cf';
import { CloudFoundryCellAppsComponent } from './cloud-foundry-cell-apps.component';

describe('CloudFoundryCellAppsComponent', () => {
  let component: CloudFoundryCellAppsComponent;
  let fixture: ComponentFixture<CloudFoundryCellAppsComponent>;
  let http: HttpTestingController;

  const isMetricsRequest = (r: { url: string }) => r.url.startsWith('/pp/v1/metrics/');
  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActiveRouteCfCell,
          useValue: { cfGuid: testSCFEndpointGuid, cellId: 'test-cell' }
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CloudFoundryCellAppsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the empty message when the cell runs no apps', async () => {
    http.expectOne(isMetricsRequest).flush({
      [testSCFEndpointGuid]: { status: 'success', data: { resultType: 'vector', result: [] } },
    });
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el().querySelector('[data-test="empty"]')?.textContent).toContain('There are no applications');
    });
    expect(el().querySelector('[data-test="empty-error"]')).toBeNull();
  });

  it('shows an error with Retry, not the empty message, when the metrics request fails', async () => {
    http.expectOne(isMetricsRequest).flush(
      { error: 'Unsupported prometheus query' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el().querySelector('[data-test="empty-error"]')).not.toBeNull();
    });
    expect(el().querySelector('[data-test="empty"]')).toBeNull();
    expect(el().querySelector('[data-test="empty-error"]')?.textContent).toContain('Failed to load the apps on this cell');

    // Retry sends the request again; a success clears the error.
    (el().querySelector('[data-test="empty-error-retry"]') as HTMLButtonElement).click();
    const retried = await vi.waitFor(() => http.expectOne(isMetricsRequest));
    retried.flush({
      [testSCFEndpointGuid]: { status: 'success', data: { resultType: 'vector', result: [] } },
    });
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el().querySelector('[data-test="empty-error"]')).toBeNull();
    });
    expect(el().querySelector('[data-test="empty"]')).not.toBeNull();
  });
});
