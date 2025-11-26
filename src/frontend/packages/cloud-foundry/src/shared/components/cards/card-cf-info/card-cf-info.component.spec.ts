import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory, entityCatalog, type TestEntityCatalog, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
