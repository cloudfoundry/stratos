import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory, entityCatalog, TestEntityCatalog, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { TailwindDialogService } from '@stratosui/core';
import { generateTestCfEndpointService } from '@test-framework/cf';
import { generateASEntities } from '@stratosui/cf-autoscaler';

import { generateCFEntities } from '../../../../cf-entity-generator';
import { UserInviteService, UserInviteConfigureService } from '../../../../features/cf/user-invites/user-invite.service';
import { CardCfInfoComponent } from "./card-cf-info.component";

describe('CardCfInfoComponent', () => {
  let component: CardCfInfoComponent;
  let fixture: ComponentFixture<CardCfInfoComponent>;

  beforeEach(async () => {
      // Clear and register CF entities
      const testEntityCatalog = entityCatalog as TestEntityCatalog;
      testEntityCatalog.clear();
      [...generateCFEntities(), ...generateStratosEntities(), ...generateASEntities()].forEach(entity => {
        entityCatalog.register(entity);
      });

      await TestBed.configureTestingModule({
        imports: [
          CardCfInfoComponent,
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          ...STORE_TEST_PROVIDERS,
          importProvidersFrom(createBasicStoreModule()),
          ...generateTestCfEndpointService(),
          EntityServiceFactory,
          EntityMonitorFactory,
          PaginationMonitorFactory,
          EntityCatalogHelper,
          UserInviteService,
          UserInviteConfigureService,
          TailwindDialogService,
        ]
      }).compileComponents();

      // Initialize EntityCatalogHelper
      const ech = TestBed.inject(EntityCatalogHelper);
      EntityCatalogHelpers.SetEntityCatalogHelper(ech);
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Drain the autoscaler /info request the component fires in
    // ngOnInit (FWT-959 wave-3 A-effects-cleanup). Replying with a
    // 404 lets the data service settle into "autoscaler not
    // configured", matching the legacy effect-side fallback.
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req =>
      req.flush('Not Found', { status: 404, statusText: 'Not Found' }),
    );
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
