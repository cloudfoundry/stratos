import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { EndpointModel, entityCatalog, EntityCatalogHelper, EntityCatalogHelpers, generateStratosEntities } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(() => {
    // Register stratos entities so `systemInfo`, `userFavorite`, etc. are
    // available to any catalog lookups exercised during the row render.
    // The endpoint schema itself no longer lives in the catalog — it ships
    // on the data source's action — so registration is no longer
    // load-bearing for endpoint lookups, but staying consistent with the
    // rest of the suite avoids surprising drift.
    (entityCatalog as any).clear();
    generateStratosEntities().forEach(entity => entityCatalog.register(entity));

    TestBed.configureTestingModule({
      imports: [
        TableCellEndpointNameComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
      ]
    });
    TestBed.compileComponents();

    // Initialize EntityCatalogHelper so components using stratosEntityCatalog.<entity>.store work
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointNameComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: ''
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
