import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { ListConfig, CoreModule } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import { generateCFEntities } from '../../../../../../../cf-entity-generator';
import { CfSpaceEventsConfigService } from '../../../../../../../shared/components/list/list-types/cf-events/types/cf-space-events-config.service';
import { CloudFoundryUserProvidedServicesService } from '../../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceEventsComponent } from './cloud-foundry-space-events.component';

describe('CloudFoundrySpaceEventsComponent', () => {
  let component: CloudFoundrySpaceEventsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundrySpaceEventsComponent,
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
        {
          provide: ListConfig,
          useClass: CfSpaceEventsConfigService,
        },
        CloudFoundrySpaceService,
        CloudFoundryEndpointService,
        CloudFoundryOrganizationService,
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper manually
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
