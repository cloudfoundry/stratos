import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TailwindSnackBarService } from '@stratosui/core';
import { EntityCatalogHelper, EntityCatalogHelpers, PaginationMonitorFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { ApplicationServiceMock } from '@test-framework/application-service-helper';
import { CloudFoundryTestingModule, CF_BASE_TEST_PROVIDERS } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationStateService } from '../../../services/application-state.service';
import { CardAppInstancesComponent } from './card-app-instances.component';
describe('CardAppInstancesComponent', () => {
  let component: CardAppInstancesComponent;
  let fixture: ComponentFixture<CardAppInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardAppInstancesComponent,
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
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ConfirmationDialogService,
        CurrentUserPermissionsService,
        PaginationMonitorFactory,
        TailwindSnackBarService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
