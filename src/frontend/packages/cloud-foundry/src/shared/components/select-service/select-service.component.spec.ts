import { async, ComponentFixture, TestBed } from '@angular/core/testing';

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
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import { CsiGuidsService } from '../add-service-instance/csi-guids.service';
import { CfOrgSpaceLinksComponent } from '../cf-org-space-links/cf-org-space-links.component';
import { CfServiceCardComponent } from '../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import {
  TableCellServiceActiveComponent,
} from '../list/list-types/cf-services/table-cell-service-active/table-cell-service-active.component';
import {
  TableCellServiceBindableComponent,
} from '../list/list-types/cf-services/table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from '../list/list-types/cf-services/table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import {
  TableCellServiceReferencesComponent,
} from '../list/list-types/cf-services/table-cell-service-references/table-cell-service-references.component';
import {
  TableCellServiceTagsComponent,
} from '../list/list-types/cf-services/table-cell-service-tags/table-cell-service-tags.component';
import { ServiceIconComponent } from '../service-icon/service-icon.component';
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
        MultilineTitleComponent,
        TableCellServiceActiveComponent,
        TableCellServiceBindableComponent,
        TableCellServiceReferencesComponent,
        TableCellServiceCfBreadcrumbsComponent,
        TableCellServiceTagsComponent
      ],
      imports: generateCfBaseTestModulesNoShared(),
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
