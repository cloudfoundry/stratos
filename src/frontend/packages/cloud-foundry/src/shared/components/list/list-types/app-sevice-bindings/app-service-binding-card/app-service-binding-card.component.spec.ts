import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConfirmationDialogService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogHelper, EntityCatalogHelpers, PaginationMonitorFactory, APIResource } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { ApplicationServiceMock, CloudFoundryTestingModule, CF_BASE_TEST_PROVIDERS } from "@test-framework/cf";
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { AppServiceBindingCardComponent } from './app-service-binding-card.component';
describe('AppServiceBindingCardComponent', () => {
  let component: AppServiceBindingCardComponent;
  let fixture: ComponentFixture<AppServiceBindingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppServiceBindingCardComponent,
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
        
        PaginationMonitorFactory,
        ...cfCurrentUserPermissionsService,
        DatePipe,
        ServiceActionHelperService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AppServiceBindingCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        app_guid: '',
        service_instance_guid: 'service_instance_guid',
        credentials: {},
        binding_options: {},
        gateway_name: '',
        volume_mounts: [],
        app_url: '',
        service_instance_url: '',
        service_instance: {
          entity: {}
        } as APIResource<IServiceInstance>
      },
      metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
