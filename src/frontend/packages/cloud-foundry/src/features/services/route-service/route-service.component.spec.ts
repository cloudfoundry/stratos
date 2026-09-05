import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { RouteServiceComponent } from './route-service.component';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';

function source<T>(value: T) {
  return {
    value: signal(value).asReadonly(),
    isLoading: signal(false).asReadonly(),
    error: signal(null).asReadonly(),
  };
}

describe('RouteServiceComponent — bind patches the binding from the response', () => {
  let component: RouteServiceComponent;
  let fixture: ComponentFixture<RouteServiceComponent>;
  let http: HttpTestingController;
  let bindingFetches: number;

  beforeEach(async () => {
    bindingFetches = 0;
    await TestBed.configureTestingModule({
      imports: [RouteServiceComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { endpointId: 'cf-1', routeGuid: 'r-1' }, queryParams: {}, data: {}, queryParamMap: { get: () => '' } } },
        },
        {
          provide: ServiceCatalogDataService,
          useValue: {
            serviceInstancesInSpace: () => source([{ guid: 'si-1', name: 'logger', type: 'managed' }]),
            routeServiceBinding: () => { bindingFetches++; return source(null); },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RouteServiceComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('shows the created binding from a 201 body without refetching', async () => {
    component.selectedSiGuid.set('si-1');
    const done = component.bindStepHandle.submit();
    http.expectOne(r => r.method === 'POST' && r.url === '/pp/v1/cf/service_route_bindings/cf-1').flush(
      {
        guid: 'b-1', route_service_url: 'https://logger.example', last_operation: { state: 'succeeded' },
        relationships: { route: { data: { guid: 'r-1' } }, service_instance: { data: { guid: 'si-1' } } },
      },
      { status: 201, statusText: 'Created' },
    );
    await done;

    expect(component.binding()).toEqual({
      guid: 'b-1', serviceInstanceGuid: 'si-1', routeServiceUrl: 'https://logger.example', lastOperationState: 'succeeded',
    });
    expect(component.boundInstanceName()).toBe('logger');
    expect(bindingFetches).toBe(1);
  });

  it('falls back to a refetch when the response is a completed job rather than the binding', async () => {
    component.selectedSiGuid.set('si-1');
    const done = component.bindStepHandle.submit();
    http.expectOne(r => r.method === 'POST' && r.url === '/pp/v1/cf/service_route_bindings/cf-1').flush(
      { state: 'COMPLETE', result: { guid: 'job-9', operation: 'service_route_binding.create', state: 'COMPLETE' } },
      { status: 200, statusText: 'OK' },
    );
    await done;

    expect(component.binding()).toBeNull();
    expect(bindingFetches).toBe(2);
  });
});
