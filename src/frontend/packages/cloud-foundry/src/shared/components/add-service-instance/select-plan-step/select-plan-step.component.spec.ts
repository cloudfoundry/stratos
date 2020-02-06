import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import {
  CopyToClipboardComponent,
} from '../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SelectPlanStepComponent } from './select-plan-step.component';


describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectPlanStepComponent,
        CardStatusComponent,
        MetadataItemComponent,
        CopyToClipboardComponent,
        ServicePlanPublicComponent,
        ServicePlanPriceComponent,
        FocusDirective
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        EntityServiceFactory,
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        CsiModeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
