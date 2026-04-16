import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { APIResource } from '@stratosui/store';

import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  serviceInstancesEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../cf-entity-types';
import { TableCellLastServiceBindingComponent } from './table-cell-last-service-binding.component';

function makeInstance(): APIResource<IServiceInstance> {
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
      service_bindings: [],
    } as unknown as IServiceInstance,
    metadata: { created_at: '', guid: 'si', updated_at: '', url: '' },
  };
}

describe('TableCellLastServiceBindingComponent', () => {
  let component: TableCellLastServiceBindingComponent;
  let fixture: ComponentFixture<TableCellLastServiceBindingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableCellLastServiceBindingComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TableCellLastServiceBindingComponent);
    component = fixture.componentInstance;
    component.row = makeInstance();
  });

  it('creates', () => {
    component.entityKey = serviceInstancesEntityType;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('marks the cell as user-provided when entityKey matches the user-provided service instance type', () => {
    component.entityKey = userProvidedServiceInstanceEntityType;
    fixture.detectChanges();
    expect(component.isUserProvidedServiceInstance).toBe(true);
  });

  it('marks the cell as NOT user-provided for a managed service instance type', () => {
    component.entityKey = serviceInstancesEntityType;
    fixture.detectChanges();
    expect(component.isUserProvidedServiceInstance).toBe(false);
  });

  it('renders a dash placeholder for user-provided service instances', () => {
    component.entityKey = userProvidedServiceInstanceEntityType;
    fixture.detectChanges();
    const inner = fixture.debugElement.query(By.css('app-service-instance-last-service-binding'));
    expect(inner).toBeNull();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('-');
  });

  it('renders the service-instance-last-service-binding child for managed instances', () => {
    component.entityKey = serviceInstancesEntityType;
    fixture.detectChanges();
    const inner = fixture.debugElement.query(By.css('app-service-instance-last-service-binding'));
    expect(inner).toBeTruthy();
  });
});
