import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ServicesWallService } from '../../../../features/services/services/services-wall.service';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import {
  ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../chips/chips.component';
import { MetaCardComponent } from '../../list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from '../../list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from '../../list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { CfServiceCardComponent } from '../../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';
import { CsiGuidsService } from '../csi-guids.service';
import { SelectServiceComponent } from './select-service.component';
import { MultilineTitleComponent } from '../../multiline-title/multiline-title.component';

describe('SelectServiceComponent', () => {
  let component: SelectServiceComponent;
  let fixture: ComponentFixture<SelectServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectServiceComponent,
        CardStatusComponent,
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
        ApplicationStateIconPipe,
        MultilineTitleComponent
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        PaginationMonitorFactory,
        ServicesWallService,
        EntityServiceFactory,
        CsiGuidsService,
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
