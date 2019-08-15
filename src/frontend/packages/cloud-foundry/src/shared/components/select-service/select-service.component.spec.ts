import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../core/src/core/entity-service-factory.service';
import {
  ApplicationStateIconComponent,
} from '../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  BooleanIndicatorComponent,
} from '../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CardStatusComponent } from '../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { AppChipsComponent } from '../../../../../core/src/shared/components/chips/chips.component';
import {
  MetaCardComponent,
} from '../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import {
  MultilineTitleComponent,
} from '../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { ServiceIconComponent } from '../../../../../core/src/shared/components/service-icon/service-icon.component';
import { EntityMonitorFactory } from '../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import { CsiGuidsService } from '../add-service-instance/csi-guids.service';
import { CfOrgSpaceLinksComponent } from '../cf-org-space-links/cf-org-space-links.component';
import { CfServiceCardComponent } from '../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { SelectServiceComponent } from './select-service.component';

describe('SelectServiceComponent', () => {
  let component: SelectServiceComponent;
  let fixture: ComponentFixture<SelectServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectServiceComponent,
        CfOrgSpaceLinksComponent,
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
