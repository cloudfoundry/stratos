import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import {
  StServiceInstance,
} from '../../../../services/endpoint-data/stratos-types';
import { ServiceRecentInstancesCardComponent } from './service-recent-instances-card.component';

class FakeEndpointDataService {
  private readonly _serviceInstances = signal<StServiceInstance[]>([]);
  serviceInstances = this._serviceInstances.asReadonly();
  isLoadingServicesDetails = () => false;
  servicesDetailsLastFetched = () => new Date();
  loadServicesDetails = (): Promise<void> => Promise.resolve();
  setInstances(rows: StServiceInstance[]): void { this._serviceInstances.set(rows); }
}

class FakeRegistry {
  acquire(_guid: string): unknown { return new FakeEndpointDataService(); }
  release(_guid: string): void { /* noop */ }
}

describe('ServiceRecentInstancesCardComponent', () => {
  let component: ServiceRecentInstancesCardComponent;
  let fixture: ComponentFixture<ServiceRecentInstancesCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ServiceRecentInstancesCardComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: EndpointDataRegistry, useClass: FakeRegistry },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceRecentInstancesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
