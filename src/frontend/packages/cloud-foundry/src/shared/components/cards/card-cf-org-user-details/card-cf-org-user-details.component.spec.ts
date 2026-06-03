import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES, appReducers, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { MetadataItemComponent, BooleanIndicatorComponent, CapitalizeFirstPipe } from '@stratosui/core';
import { CloudFoundryTestingModule, generateCFEntities, CloudFoundryOrganizationServiceMock } from '@test-framework/cf';
import { CloudFoundryOrganizationService } from '../../../../features/cf/services/cloud-foundry-organization.service';
import { CardCfOrgUserDetailsComponent } from './card-cf-org-user-details.component';

describe('CardCfOrgUserDetailsComponent', () => {
  let component: CardCfOrgUserDetailsComponent;
  let fixture: ComponentFixture<CardCfOrgUserDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfOrgUserDetailsComponent,
        MetadataItemComponent,
        BooleanIndicatorComponent,
        CapitalizeFirstPipe,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          CloudFoundryTestingModule,
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityCatalogHelper,
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfOrgUserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
