import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { APIResource } from '@stratosui/store/types/api.types';
import { generateTestApplicationServiceProvider } from "@test-framework/application-service-helper";
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  ApplicationEnvVarsHelper,
} from '../../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { AppServiceBindingCardComponent } from './app-service-binding-card.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('AppServiceBindingCardComponent', () => {
  let component: AppServiceBindingCardComponent;
  let fixture: ComponentFixture<AppServiceBindingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppServiceBindingCardComponent,
        ServiceIconComponent,
        CfOrgSpaceLinksComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        ConfirmationDialogService,
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
