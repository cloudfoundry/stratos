import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '@stratosui/core';
import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { CompactServiceInstanceCardComponent } from '../compact-service-instance-card/compact-service-instance-card.component';
import { ServiceRecentInstancesCardComponent } from './service-recent-instances-card.component';

describe('ServiceRecentInstancesCardComponent', () => {
  let component: ServiceRecentInstancesCardComponent;
  let fixture: ComponentFixture<ServiceRecentInstancesCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ServiceRecentInstancesCardComponent,
        CompactServiceInstanceCardComponent,
        AppChipsComponent,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        importProvidersFrom(createBasicStoreModule()),
        provideRouter([]),
        provideHttpClient(),
        { provide: ServicesService, useClass: ServicesServiceMock },
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceRecentInstancesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
