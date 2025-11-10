import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule, TabNavService } from '@stratosui/core';
import { EntityServiceFactory, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceTabsBaseComponent } from "./service-tabs-base.component";

describe('ServiceTabsBaseComponent', () => {
  let component: ServiceTabsBaseComponent;
  let fixture: ComponentFixture<ServiceTabsBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceTabsBaseComponent,
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityCatalogHelper,
        EntityServiceFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        TabNavService,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper manually
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
