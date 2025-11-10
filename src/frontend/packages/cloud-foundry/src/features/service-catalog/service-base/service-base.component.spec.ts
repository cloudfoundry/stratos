import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityServiceFactory, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceBaseComponent } from "./service-base.component";

describe('ServiceBaseComponent', () => {
  let component: ServiceBaseComponent;
  let fixture: ComponentFixture<ServiceBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceBaseComponent,
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
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        EntityServiceFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
