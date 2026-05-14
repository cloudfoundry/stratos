import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterAll, afterEach } from 'vitest';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { CoreModule, TabNavService } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { AutoscalerTabExtensionComponent } from './autoscaler-tab-extension.component';

// FWT-959 wave-3 (A-effects-cleanup): the component used to chain
// EntityServiceFactory.create + Store.dispatch for policy / metric /
// detach / RouterNav. With the @ngrx surface gone, the spec mocks are
// trimmed to the bare TestBed harness — autoscaler I/O is now plain
// HttpClient via the signal-native data services, so the existing
// HttpTestingController drain in afterEach() catches every dispatched
// request without per-action mock plumbing.
describe('AutoscalerTabExtensionComponent', () => {
  let component: AutoscalerTabExtensionComponent;
  let fixture: ComponentFixture<AutoscalerTabExtensionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AutoscalerTabExtensionComponent,
      ],
      providers: [
        importProvidersFrom(
          CfAutoscalerTestingModule,
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        provideRouter([]),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerTabExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Drain every autoscaler HTTP request fired by ngOnInit (info,
    // policy, scaling-history) so the HttpTestingController doesn't
    // leave them hanging. Each is replied with a benign payload —
    // info gets a real shape, the others are flushed to defaults.
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req => {
      if (req.request.url.endsWith('/info')) {
        req.flush({ name: 'as', build: '3.0.0', support: '', description: '' });
      } else if (req.request.url.endsWith('/policy')) {
        req.flush('Not Found', { status: 404, statusText: 'Not Found' });
      } else {
        req.flush({ resources: [], total_results: 0, total_pages: 0 });
      }
    });
    httpMock.verify();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
