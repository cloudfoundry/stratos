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
import { CfServiceCardComponent } from './cf-service-card.component';

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
    component.row = {
      entity: {
        label: '',
        description: '',
        active: 1,
        bindable: 1,
        unique_id: '',
        extra: '',
        tags: [''],
        requires: [''],
        service_broker_guid: 'service_broker_guid',
        plan_updateable: 1,
        service_plans_url: '',
        service_plans: [],
      },
      metadata: null,
    };
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
    component.row = {
      ...component.serviceEntity,
      entity: {
        ...component.serviceEntity.entity,
        active: 0
      }
    };
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
    component.row = {
      ...component.serviceEntity,
      entity: {
        ...component.serviceEntity.entity,
        bindable: 0
      }
    };
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    const bindableStatus = fixture.nativeElement.querySelector('app-table-cell-service-bindable').textContent;

    expect(bindableStatus).toContain('No');
  });
});
