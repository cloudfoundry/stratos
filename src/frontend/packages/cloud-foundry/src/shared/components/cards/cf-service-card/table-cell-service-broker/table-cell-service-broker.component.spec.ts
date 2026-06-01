import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceBrokerComponent, TableCellServiceBrokerComponentMode } from './table-cell-service-broker.component';
import { ServiceCatalogDataService, SignalSource } from '../../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker, StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';

describe('TableCellServiceBrokerComponent', () => {
  let component: TableCellServiceBrokerComponent;
  let fixture: ComponentFixture<TableCellServiceBrokerComponent>;
  let lastBrokerLookup: { cnsiGuid: string; brokerGuid: string } | null;

  beforeEach(async () => {
    lastBrokerLookup = null;
    const serviceCatalogStub: Partial<ServiceCatalogDataService> = {
      serviceBroker: (cnsiGuid: string, brokerGuid: string): SignalSource<StServiceBroker | null> => {
        lastBrokerLookup = { cnsiGuid, brokerGuid };
        const broker: StServiceBroker = {
          guid: brokerGuid,
          name: 'global-broker',
          url: 'https://b.example',
          space: undefined,
          labels: {},
          annotations: {},
          cnsiGuid,
          createdAt: '',
          updatedAt: '',
        };
        return {
          value: signal<StServiceBroker | null>(broker).asReadonly(),
          isLoading: signal(false).asReadonly(),
          error: signal<HttpErrorResponse | null>(null).asReadonly(),
        };
      },
    };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ServiceCatalogDataService, useValue: serviceCatalogStub },
      ],
      imports: [TableCellServiceBrokerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellServiceBrokerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('resolves broker via ServiceCatalogDataService when row is assigned', () => {
    component.config = { mode: TableCellServiceBrokerComponentMode.NAME };
    const offering: StServiceOffering = {
      guid: 'svc-1',
      cnsiGuid: 'cnsi-1',
      name: 'svc',
      broker: { guid: 'broker-7' },
      createdAt: '2026-01-01T00:00:00Z',
    };
    component.row = offering;
    fixture.detectChanges();

    expect(lastBrokerLookup).toEqual({ cnsiGuid: 'cnsi-1', brokerGuid: 'broker-7' });
    expect(component.broker()?.name).toBe('global-broker');
  });
});
