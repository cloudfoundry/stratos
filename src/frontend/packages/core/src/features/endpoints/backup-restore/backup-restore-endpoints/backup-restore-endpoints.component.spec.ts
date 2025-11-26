import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityCatalogTestModule, EntityServiceFactory, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule, BaseTestModulesNoShared } from "@test-framework/core-test.helper";
import { SharedModule } from '@stratosui/core';
import { TabNavService } from '../../../../tab-nav.service';
import { BackupRestoreEndpointsComponent } from './backup-restore-endpoints.component';

describe('BackupRestoreEndpointsComponent', () => {
  let component: BackupRestoreEndpointsComponent;
  let fixture: ComponentFixture<BackupRestoreEndpointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        BackupRestoreEndpointsComponent,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
              ]
            }
          ]
        },
        createBasicStoreModule(),
        AppTestModule,
      ],
      providers: [
        TabNavService,
        EntityServiceFactory,
        ...(STORE_TEST_PROVIDERS || []),
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupRestoreEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
