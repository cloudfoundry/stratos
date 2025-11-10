import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApplicationStateIconComponent } from '@stratosui/core';
import {
  EntityCatalogTestModule,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES,
  appReducers,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
import { CompactAppCardComponent } from './compact-app-card.component';
describe('CompactAppCardComponent', () => {
  let component: CompactAppCardComponent;
  let fixture: ComponentFixture<CompactAppCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CompactAppCardComponent,
        ApplicationStateIconComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        ApplicationStateService,
        importProvidersFrom(
          CloudFoundryTestingModule,
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactAppCardComponent);
    component = fixture.componentInstance;
    component.app = {
      entity: {},
      metadata: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
