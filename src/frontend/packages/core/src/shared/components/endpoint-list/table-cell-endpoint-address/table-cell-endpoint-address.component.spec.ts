import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { EndpointModel } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule, seedEndpointsDataService } from '@stratosui/store/testing';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';

import { EndpointListHelper } from '../endpoint-list.helpers';
import { TableCellEndpointAddressComponent } from './table-cell-endpoint-address.component';

describe('TableCellEndpointAddressComponent', () => {
  let component: TableCellEndpointAddressComponent;
  let fixture: ComponentFixture<TableCellEndpointAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule,
        CoreModule,
        NoopAnimationsModule,
        TableCellEndpointAddressComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        EndpointListHelper,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointAddressComponent);
    component = fixture.componentInstance;
    seedEndpointsDataService([
      { guid: 'ep-1', api_endpoint: { Scheme: 'https', Host: 'one.example.com', Path: '' } },
      { guid: 'ep-2', api_endpoint: { Scheme: 'https', Host: 'two.example.com', Path: '' } },
    ] as EndpointModel[]);
    fixture.componentRef.setInput('row', { guid: 'ep-1' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the address of the endpoint the row points at, and follows a new row', async () => {
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('https://one.example.com');

    fixture.componentRef.setInput('row', { endpointId: 'ep-2' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('https://two.example.com');
    expect(fixture.nativeElement.textContent).not.toContain('one.example.com');
  });
});
