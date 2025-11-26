import { DatePipe } from '@angular/common';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityServiceFactory, EntityCatalogFeatureModule, CATALOGUE_ENTITIES, generateStratosEntities, entityCatalog, type TestEntityCatalog } from '@stratosui/store';
import { createBasicStoreModule } from '@test-framework';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServicePlansComponent } from "./service-plans.component";

describe('ServicePlansComponent', () => {
  let component: ServicePlansComponent;
  let fixture: ComponentFixture<ServicePlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicePlansComponent,
        createBasicStoreModule(),
        EntityCatalogFeatureModule,
        EffectsModule.forRoot([]),
      ],
      providers: [
        EntityServiceFactory,
        DatePipe,
        { provide: ServicesService, useClass: ServicesServiceMock },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: CATALOGUE_ENTITIES,
          useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
            return [
              ...generateCFEntities(),
              ...generateStratosEntities(),
            ];
          },
          multi: true
        },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
