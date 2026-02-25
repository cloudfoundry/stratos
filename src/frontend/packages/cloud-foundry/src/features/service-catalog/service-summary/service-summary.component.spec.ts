import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  EntityServiceFactory,
  EntityMonitorFactory,
  EntityCatalogFeatureModule,
  CATALOGUE_ENTITIES,
  generateStratosEntities,
  entityCatalog,
  TestEntityCatalog,
  ENTITY_CATALOG_TOKEN
} from '@stratosui/store';
import { createBasicStoreModule } from '@test-framework';
import { generateCFEntities } from '../../../cf-entity-generator';
import {
  CompactServiceInstanceCardComponent,
} from '../../../shared/components/cards/compact-service-instance-card/compact-service-instance-card.component';
import {
  ServiceBrokerCardComponent,
} from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from '../../../shared/components/cards/service-recent-instances-card/service-recent-instances-card.component';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
import { ServiceIconComponent } from '../../../shared/components/service-icon/service-icon.component';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceSummaryComponent } from "./service-summary.component";

describe('ServiceSummaryComponent', () => {
  let component: ServiceSummaryComponent;
  let fixture: ComponentFixture<ServiceSummaryComponent>;

  beforeEach(async () => {
    // Initialize entity catalog before test
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();

    await TestBed.configureTestingModule({
      imports: [
        ServiceSummaryComponent,
        ServiceSummaryCardComponent,
        ServiceBrokerCardComponent,
        ServiceRecentInstancesCardComponent,
        ServiceIconComponent,
        CompactServiceInstanceCardComponent,
        EntityCatalogFeatureModule,
        EffectsModule.forRoot([]),
        createBasicStoreModule(),
      ],
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ENTITY_CATALOG_TOKEN,
          useValue: entityCatalog
        },
        {
          provide: CATALOGUE_ENTITIES,
          useFactory: () => {
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
    fixture = TestBed.createComponent(ServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
