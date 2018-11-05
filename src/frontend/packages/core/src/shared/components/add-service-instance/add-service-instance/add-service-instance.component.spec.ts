import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import {
  ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { AppChipsComponent } from '../../chips/chips.component';
import {
  CreateApplicationStep1Component,
} from '../../create-application/create-application-step1/create-application-step1.component';
import { MetaCardComponent } from '../../list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from '../../list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from '../../list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { CfServiceCardComponent } from '../../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { PageHeaderModule } from '../../page-header/page-header.module';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';
import { SteppersModule } from '../../stepper/steppers.module';
import { BindAppsStepComponent } from '../bind-apps-step/bind-apps-step.component';
import { SelectPlanStepComponent } from '../select-plan-step/select-plan-step.component';
import { SelectServiceComponent } from '../select-service/select-service.component';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { AddServiceInstanceComponent } from './add-service-instance.component';

describe('AddServiceInstanceComponent', () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddServiceInstanceComponent,
        SelectPlanStepComponent,
        SpecifyDetailsStepComponent,
        BindAppsStepComponent,
        SelectServiceComponent,
        CreateApplicationStep1Component,
        CardStatusComponent,
        MetadataItemComponent,
        CfServiceCardComponent,
        MetaCardComponent,
        ServiceIconComponent,
        MetaCardTitleComponent,
        MetaCardKeyComponent,
        MetaCardItemComponent,
        MetaCardComponent,
        MetaCardValueComponent,
        BooleanIndicatorComponent,
        AppChipsComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: [
        PageHeaderModule,
        SteppersModule,
        // CoreModule,
        BaseTestModulesNoShared
      ],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        EntityMonitorFactory,
        PaginationMonitorFactory,
        CfOrgSpaceDataService,
        InternalEventMonitorFactory,
        CloudFoundryService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
