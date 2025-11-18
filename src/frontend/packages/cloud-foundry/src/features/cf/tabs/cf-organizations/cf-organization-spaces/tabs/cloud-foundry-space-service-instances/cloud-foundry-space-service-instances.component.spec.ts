import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  CoreModule
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateActiveRouteCfOrgSpaceMock, getCfSpaceServiceMock } from '@test-framework/cf';
import { generateCFEntities } from '../../../../../../../cf-entity-generator';
import { ServiceActionHelperService } from '../../../../../../../shared/data-services/service-action-helper.service';
import { CloudFoundrySpaceServiceInstancesComponent } from './cloud-foundry-space-service-instances.component';

describe('CloudFoundrySpaceServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundrySpaceServiceInstancesComponent,
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
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        generateActiveRouteCfOrgSpaceMock(),
        getCfSpaceServiceMock,
        DatePipe,
        ServiceActionHelperService,
        ...cfCurrentUserPermissionsService,
      ],
    })
      .compileComponents();

    // Initialize EntityCatalogHelper manually
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
