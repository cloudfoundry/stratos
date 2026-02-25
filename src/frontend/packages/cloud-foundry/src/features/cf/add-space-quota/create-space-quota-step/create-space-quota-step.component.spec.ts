import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogHelper, EntityCatalogHelpers, appReducers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '@stratosui/core';
import { StoreModule } from '@ngrx/store';
import { generateTestCfEndpointServiceProvider, generateCfActiveRouteMock, CloudFoundryTestingModule } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step.component';

describe('CreateSpaceQuotaStepComponent', () => {
  let component: CreateSpaceQuotaStepComponent;
  let fixture: ComponentFixture<CreateSpaceQuotaStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateSpaceQuotaStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: {
              strictStateImmutability: false,
              strictActionImmutability: false
            }
          }),
          CoreModule,
          NoopAnimationsModule,
          CloudFoundryTestingModule
        ),
        ...generateTestCfEndpointServiceProvider(),
        generateCfActiveRouteMock(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
