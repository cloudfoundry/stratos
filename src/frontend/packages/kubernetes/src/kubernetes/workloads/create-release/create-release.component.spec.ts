import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';

import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { ConfirmationDialogService, TabNavService } from '@stratosui/core';
import { EntityMonitorFactory, InternalEventMonitorFactory, PaginationMonitorFactory } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { MockChartService } from '../../../helm/monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { ConfigService } from '../../../helm/monocular/shared/services/config.service';
import { HelmTestingModule } from '../../../helm/helm-testing.module';
import { KubernetesTestingModule } from '../../kubernetes.testing.module';
import { CreateReleaseComponent } from './create-release.component';

// Mock HTTP Interceptor for testing
class MockHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req);
  }
}

// Mock ChartValuesEditorComponent to avoid injection context issues
import { Component, Input } from '@angular/core';
import { ChartValuesConfig } from '../chart-values-editor/chart-values-editor.component';

@Component({
  selector: 'app-chart-values-editor',
  template: '',
  standalone: true
})
class MockChartValuesEditorComponent {
  @Input() config?: ChartValuesConfig;

  getValues() {
    return {};
  }

  resizeEditor() {
    // noop
  }
}

describe('CreateReleaseComponent', () => {
  let component: CreateReleaseComponent;
  let fixture: ComponentFixture<CreateReleaseComponent>;
  let httpMock: HttpTestingController;

  // Stub the namespace data service so the namespace list read and the
  // create write don't hit live HTTP.
  const createNs = vi.fn().mockResolvedValue(undefined);
  const refreshNs = vi.fn().mockResolvedValue(undefined);
  const namespaceDataStub = {
    create: createNs,
    refresh: refreshNs,
    allNamespacesAcrossEndpoints: (_g: readonly string[]) => signal([]) as Signal<unknown[]>,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [
        CreateReleaseComponent,
        AppTestModule,
        createBasicStoreModule(),
        KubernetesTestingModule,
        HelmTestingModule,
        MockChartValuesEditorComponent,
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockHttpInterceptor,
          multi: true
        },
        PaginationMonitorFactory,
        EntityMonitorFactory,
        InternalEventMonitorFactory,
        TabNavService,
        ConfirmationDialogService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { repo: 'test-repo', name: 'test-chart', version: 'test-version' },
              queryParams: {}
            }
          }
        },
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ConfigService, useValue: { appName: 'appName' } },
        { provide: KubeNamespaceDataService, useValue: namespaceDataStub },
        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CreateReleaseComponent);
    component = fixture.componentInstance;

    // Don't flush the HTTP request yet - this prevents the config from being set
    // which would trigger the ChartValuesEditorComponent initialization
    fixture.detectChanges();

    // Now flush the chart version request
    const req = httpMock.match('/pp/v1/chartsvc/v1/charts/test-repo/test-chart/versions/test-version')[0];
    if (req) {
      req.flush({
        data: {
          id: 'test-repo/test-chart',
          type: 'chart',
          attributes: {
            version: 'test-version',
            urls: ['https://example.com/chart.tgz'],
            app_version: '1.0',
            created: new Date('2017-02-13T04:33:57.218083521Z'),
            digest: 'eba0c51d4bc5b88d84f83d8b2ba0c5e5a3aad8bc19875598198bdbb0b675f683',
            icons: [],
            readme: '/assets/test-repo/test-chart/test-version/README.md'
          },
          relationships: {
            chart: {
              data: {
                name: 'test-chart',
                repo: {
                  name: 'test-repo',
                  url: 'https://example.com'
                },
                description: 'Test chart',
                home: 'https://example.com',
                keywords: [],
                maintainers: [],
                sources: []
              },
              links: {
                self: '/v1/charts/test-repo/test-chart/versions/test-version'
              }
            }
          }
        }
      });
    }
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('createNamespace delegates to KubeNamespaceDataService.create on success', async () => {
    component.details.controls.endpoint.setValue('k1');
    component.details.controls.releaseNamespace.setValue('ns-new');
    component.details.controls.createNamespace.enable();
    component.details.controls.createNamespace.setValue(true);

    const result = await firstValueFrom(component.createNamespace());

    expect(createNs).toHaveBeenCalledWith('k1', 'ns-new');
    expect(result.success).toBe(true);
  });

  it('createNamespace surfaces a failure message when create rejects', async () => {
    createNs.mockRejectedValueOnce(new Error('already exists'));
    component.details.controls.endpoint.setValue('k1');
    component.details.controls.releaseNamespace.setValue('dup');
    component.details.controls.createNamespace.enable();
    component.details.controls.createNamespace.setValue(true);

    const result = await firstValueFrom(component.createNamespace());

    expect(result.success).toBe(false);
    expect(result.message).toContain('already exists');
  });

  afterEach(() => {
    // Absorb any pending company-config request from StratosBrandingService before verify
    httpMock.match('/assets/company-config.json');
    httpMock.verify();
  });
});
