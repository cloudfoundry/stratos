import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TailwindJsonSchemaFormModule } from '../../../../../../core/src/shared/components/tailwind-json-schema-form/tailwind-json-schema-form.module';

import {
  ApplicationStateIconComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { AppChipsComponent } from '../../../../../../core/src/shared/components/chips/chips.component';
import {
  CopyToClipboardComponent,
} from '../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import {
  MetaCardComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import {
  MultilineTitleComponent,
} from '../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { PageHeaderModule } from '../../../../../../core/src/shared/components/page-header/page-header.module';
import { SteppersModule } from '../../../../../../core/src/shared/components/stepper/steppers.module';
import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '@stratosui/store/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
import { AppNameUniqueDirective } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { CfOrgSpaceLinksComponent } from '../../cf-org-space-links/cf-org-space-links.component';
import {
  CreateApplicationStep1Component,
} from '../../create-application/create-application-step1/create-application-step1.component';
import { CfServiceCardComponent } from '../../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import {
  TableCellServiceActiveComponent,
} from '../../list/list-types/cf-services/table-cell-service-active/table-cell-service-active.component';
import {
  TableCellServiceBindableComponent,
} from '../../list/list-types/cf-services/table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from '../../list/list-types/cf-services/table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import {
  TableCellServiceReferencesComponent,
} from '../../list/list-types/cf-services/table-cell-service-references/table-cell-service-references.component';
import {
  TableCellServiceTagsComponent,
} from '../../list/list-types/cf-services/table-cell-service-tags/table-cell-service-tags.component';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { SelectServiceComponent } from '../../select-service/select-service.component';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { BindAppsStepComponent } from '../bind-apps-step/bind-apps-step.component';
import { SelectPlanStepComponent } from '../select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import {
  SpecifyUserProvidedDetailsComponent,
} from '../specify-user-provided-details/specify-user-provided-details.component';
import { AddServiceInstanceComponent } from './add-service-instance.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('AddServiceInstanceComponent', () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppNameUniqueDirective,
        AddServiceInstanceComponent,
        CopyToClipboardComponent,
        SelectPlanStepComponent,
        SpecifyDetailsStepComponent,
        BindAppsStepComponent,
        SelectServiceComponent,
        CreateApplicationStep1Component,
        CardStatusComponent,
        MetadataItemComponent,
        CfServiceCardComponent,
        CfOrgSpaceLinksComponent,
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
        SchemaFormComponent,
        MultilineTitleComponent,
        ServicePlanPublicComponent,
        ServicePlanPriceComponent,
        FocusDirective,
        SpecifyUserProvidedDetailsComponent,
        TableCellServiceActiveComponent,
        TableCellServiceBindableComponent,
        TableCellServiceReferencesComponent,
        TableCellServiceCfBreadcrumbsComponent,
        TableCellServiceTagsComponent,
        ...generateCfBaseTestModulesNoShared(),
        PageHeaderModule,
        SteppersModule,
        TailwindJsonSchemaFormModule,
      ],
      providers: [
        EntityServiceFactory,
        
        { provide: ServicesService, useClass: ServicesServiceMock },
        EntityMonitorFactory,
        PaginationMonitorFactory,
        CfOrgSpaceDataService,
        InternalEventMonitorFactory,
        CloudFoundryService,
        TabNavService,
        LongRunningCfOperationsService,

        provideZonelessChangeDetection(),
      ],

    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
