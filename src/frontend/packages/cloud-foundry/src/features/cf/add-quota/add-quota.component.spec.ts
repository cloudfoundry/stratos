import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { EntityCatalogHelper, EntityCatalogHelpers, appReducers, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { LongRunningCfOperationsService } from '../../../shared/data-services/long-running-cf-op.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { AddQuotaComponent } from './add-quota.component';

describe('AddQuotaComponent', () => {
  let component: AddQuotaComponent;
  let fixture: ComponentFixture<AddQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddQuotaComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideStore(appReducers),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        TabNavService,
        LongRunningCfOperationsService,
      ]
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(AddQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
