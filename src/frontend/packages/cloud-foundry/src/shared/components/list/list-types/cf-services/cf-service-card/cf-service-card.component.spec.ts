import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES, appReducers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule } from '@test-framework';
import { generateCFEntities } from '../../../../../../cf-entity-generator';
import { StServiceOffering } from '../../../../../../services/endpoint-data/stratos-types';
import { CfServiceCardComponent } from './cf-service-card.component';

const makeOffering = (overrides: Partial<StServiceOffering> = {}): StServiceOffering => ({
  guid: 'offering-guid',
  cnsiGuid: 'cnsi-guid',
  name: 'svc',
  description: '',
  tags: [],
  requires: [],
  available: true,
  bindable: true,
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('CfServiceCardComponent', () => {
  let component: CfServiceCardComponent;
  let fixture: ComponentFixture<CfServiceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfServiceCardComponent,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
        ),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
                ...generateCFEntities()
              ]
            }
          ]
        },
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(AppTestModule),
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfServiceCardComponent);
    component = fixture.componentInstance;
    component.row = makeOffering();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('active field should be true/YES', () => {
    const activeStatus = fixture.nativeElement.querySelector('app-table-cell-service-active').textContent;

    expect(activeStatus).toContain('Yes');
  });

  it('active field should be false/NO', () => {
    component.row = makeOffering({ available: false });
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    const activeStatus = fixture.nativeElement.querySelector('app-table-cell-service-active').textContent;

    expect(activeStatus).toContain('No');
  });

  it('bindable field should be true/YES', () => {
    const bindableStatus = fixture.nativeElement.querySelector('app-table-cell-service-bindable').textContent;

    expect(bindableStatus).toContain('Yes');
  });

  it('bindable field should be false/NO', () => {
    component.row = makeOffering({ bindable: false });
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    const bindableStatus = fixture.nativeElement.querySelector('app-table-cell-service-bindable').textContent;

    expect(bindableStatus).toContain('No');
  });
});
