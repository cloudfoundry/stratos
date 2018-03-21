import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsService,
} from '../../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { AppChipsComponent } from '../../../../chips/chips.component';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { AppServiceBindingCardComponent } from './app-service-binding-card.component';
import { ApplicationStateService } from '../../../../application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';

describe('AppServiceBindingCardComponent', () => {
  let component: AppServiceBindingCardComponent;
  let fixture: ComponentFixture<AppServiceBindingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppServiceBindingCardComponent,
        MetadataCardTestComponents,
        ServiceIconComponent,
        AppChipsComponent,
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsService,
        ApplicationStateService,
        PaginationMonitorFactory,
        ConfirmationDialogService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppServiceBindingCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        app_guid: '',
        service_instance_guid: '',
        credentials: {},
        binding_options: {},
        gateway_name: '',
        volume_mounts: [],
        app_url: '',
        service_instance_url: '',
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
