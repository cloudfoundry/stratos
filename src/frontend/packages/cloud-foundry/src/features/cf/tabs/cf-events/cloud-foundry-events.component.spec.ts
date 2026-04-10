import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { Store, StoreModule } from '@ngrx/store';

import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ListConfig } from '@stratosui/core';
import { generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfAllEventsConfigService } from '../../../../shared/components/list/list-types/cf-events/types/cf-all-events-config.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryEventsComponent } from './cloud-foundry-events.component';

describe('CloudFoundryEventsComponent', () => {
  let component: CloudFoundryEventsComponent;
  let fixture: ComponentFixture<CloudFoundryEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryEventsComponent,
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
        {
          provide: ListConfig,
          useClass: CfAllEventsConfigService,
        },
        generateActiveRouteCfOrgSpaceMock(),
        CfUserService,
        CloudFoundryEndpointService,
        Store,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ],
    })
      .compileComponents();

    // Initialize EntityCatalogHelper so components using stratosEntityCatalog.<entity>.store work
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
