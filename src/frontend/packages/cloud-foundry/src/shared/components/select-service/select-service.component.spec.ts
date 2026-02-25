import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { CloudFoundryTestingModule, CF_BASE_TEST_PROVIDERS } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import { CsiGuidsService } from '../add-service-instance/csi-guids.service';
import { SelectServiceComponent } from "./select-service.component";

describe('SelectServiceComponent', () => {
  let component: SelectServiceComponent;
  let fixture: ComponentFixture<SelectServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SelectServiceComponent,
      ],
      providers: [
        ...CF_BASE_TEST_PROVIDERS,
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          NoopAnimationsModule,
          CloudFoundryTestingModule,
          createBasicStoreModule(),
        ),
        EntityCatalogHelper,
        {
          provide: APP_INITIALIZER,
          useFactory: (ech: EntityCatalogHelper) => () => EntityCatalogHelpers.SetEntityCatalogHelper(ech),
          deps: [EntityCatalogHelper],
          multi: true
        },
        PaginationMonitorFactory,
        ServicesWallService,
        EntityServiceFactory,
        CsiGuidsService,
        EntityMonitorFactory,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
