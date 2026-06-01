import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
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
        HttpClientModule,
        TableCellEndpointAddressComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        EndpointListHelper,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
