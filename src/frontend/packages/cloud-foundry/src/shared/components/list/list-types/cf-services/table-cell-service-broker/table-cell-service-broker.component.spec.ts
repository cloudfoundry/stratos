import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceBrokerComponent, TableCellServiceBrokerComponentMode } from './table-cell-service-broker.component';
import { ServiceCatalogDataService } from '../../../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker } from '../../../../../../services/endpoint-data/stratos-types';

describe('TableCellServiceBrokerComponent', () => {
  let component: TableCellServiceBrokerComponent;
  let fixture: ComponentFixture<TableCellServiceBrokerComponent>;
  let lastBrokerLookup: { cnsiGuid: string; brokerGuid: string } | null;

  beforeEach(async () => {
    lastBrokerLookup = null;
    const serviceCatalogStub: Partial<ServiceCatalogDataService> = {
      serviceBroker: (cnsiGuid: string, brokerGuid: string) => {
        lastBrokerLookup = { cnsiGuid, brokerGuid };
        const broker: StServiceBroker = {
          guid: brokerGuid,
          name: 'global-broker',
          url: 'https://b.example',
          spaceGuid: '',
          labels: {},
          annotations: {},
          cnsiGuid,
          createdAt: '',
          updatedAt: '',
        };
        return of(broker);
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

  it('resolves broker$ via ServiceCatalogDataService when row is assigned', async () => {
    component.config = { mode: TableCellServiceBrokerComponentMode.NAME };
    component.row = {
      entity: { service_broker_guid: 'broker-7', cfGuid: 'cnsi-1' },
      metadata: { guid: 'svc-1' },
    } as any;
    fixture.detectChanges();

    const broker = await firstValueFrom(component.broker$);
    expect(lastBrokerLookup).toEqual({ cnsiGuid: 'cnsi-1', brokerGuid: 'broker-7' });
    expect(broker?.name).toBe('global-broker');
  });
});
