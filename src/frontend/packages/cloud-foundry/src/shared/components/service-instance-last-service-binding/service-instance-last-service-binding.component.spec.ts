import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { APIResource } from '@stratosui/store';

import { IServiceInstance } from '../../../cf-api-svc.types';
import { ServiceInstanceLastServiceBindingComponent } from './service-instance-last-service-binding.component';

function makeInstance(
  bindings: Array<{ state: string; type: string; created_at: string } | null>
): APIResource<IServiceInstance> {
  return {
    entity: {
      service_plan_guid: '',
      space_guid: '',
      dashboard_url: '',
      type: '',
      service_guid: '',
      service_plan_url: '',
      service_bindings_url: '',
      service_keys_url: '',
      routes_url: '',
      service_url: '',
      service_bindings: bindings.map(b =>
        b
          ? {
              metadata: { guid: 'b', created_at: '', updated_at: '', url: '' },
              entity: {
                last_operation: {
                  state: b.state,
                  type: b.type,
                  created_at: b.created_at,
                  description: '',
                  updated_at: '',
                },
              },
            }
          : ({ metadata: {}, entity: {} } as unknown)
      ),
    } as unknown as IServiceInstance,
    metadata: { created_at: '', guid: 'si', updated_at: '', url: '' },
  };
}

describe('ServiceInstanceLastServiceBindingComponent', () => {
  let component: ServiceInstanceLastServiceBindingComponent;
  let fixture: ComponentFixture<ServiceInstanceLastServiceBindingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ServiceInstanceLastServiceBindingComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ServiceInstanceLastServiceBindingComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    component.serviceInstance = makeInstance([]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders a dash when the instance has no service bindings', () => {
    component.serviceInstance = makeInstance([]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.trim()).toBe('-');
  });

  it('renders the operation type and timestamp when a binding is present', () => {
    component.serviceInstance = makeInstance([
      { state: 'succeeded', type: 'create', created_at: '2026-04-10T12:00:00Z' },
    ]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Create');
  });

  it('renders a progress indicator for the in-progress state', () => {
    component.serviceInstance = makeInstance([
      { state: 'in progress', type: 'create', created_at: '' },
    ]);
    fixture.detectChanges();
    const indicator = fixture.debugElement.query(By.css('app-boolean-indicator'));
    expect(indicator).toBeTruthy();
    expect(indicator.attributes['type']).toBe('progress-progress');
  });

  it('renders a yes/no indicator (success) when the state is succeeded', () => {
    component.serviceInstance = makeInstance([
      { state: 'succeeded', type: 'create', created_at: '' },
    ]);
    fixture.detectChanges();
    const indicator = fixture.debugElement.query(By.css('app-boolean-indicator'));
    expect(indicator).toBeTruthy();
    expect(indicator.attributes['type']).toBe('yes-no');
  });

  it('renders a yes/no indicator (failure) when the state is failed', () => {
    component.serviceInstance = makeInstance([
      { state: 'failed', type: 'delete', created_at: '' },
    ]);
    fixture.detectChanges();
    const indicator = fixture.debugElement.query(By.css('app-boolean-indicator'));
    expect(indicator).toBeTruthy();
    expect(indicator.attributes['type']).toBe('yes-no');
  });

  it('uses the last binding in the array when multiple are present', () => {
    component.serviceInstance = makeInstance([
      { state: 'succeeded', type: 'create', created_at: '' },
      { state: 'in progress', type: 'update', created_at: '' },
    ]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Update');
    const indicator = fixture.debugElement.query(By.css('app-boolean-indicator'));
    expect(indicator.attributes['type']).toBe('progress-progress');
  });
});
