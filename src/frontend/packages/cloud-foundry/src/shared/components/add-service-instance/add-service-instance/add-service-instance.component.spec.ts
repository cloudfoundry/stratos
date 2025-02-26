import { MaterialDesignFrameworkModule } from "@ajsf/material";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { By } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { provideMockStore } from "@ngrx/store/testing";
import { EntityCatalogEntityConfig } from "frontend/packages/store/src/entity-catalog/entity-catalog.types";
import { getDefaultRequestState } from "frontend/packages/store/src/reducers/api-request-reducer/types";
import {
  createEntityStoreState,
  TestStoreEntity
} from "frontend/packages/store/testing/src/store-test-helper";
import { Observable } from "rxjs";
import { ApplicationStateIconComponent } from "../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component";
import { ApplicationStateIconPipe } from "../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe";
import { BooleanIndicatorComponent } from "../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component";
import { CardStatusComponent } from "../../../../../../core/src/shared/components/cards/card-status/card-status.component";
import { AppChipsComponent } from "../../../../../../core/src/shared/components/chips/chips.component";
import { CopyToClipboardComponent } from "../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component";
import { FocusDirective } from "../../../../../../core/src/shared/components/focus.directive";
import { MetaCardComponent } from "../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component";
import { MetaCardItemComponent } from "../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component";
import { MetaCardKeyComponent } from "../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component";
import { MetaCardTitleComponent } from "../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component";
import { MetaCardValueComponent } from "../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component";
import { MetadataItemComponent } from "../../../../../../core/src/shared/components/metadata-item/metadata-item.component";
import { MultilineTitleComponent } from "../../../../../../core/src/shared/components/multiline-title/multiline-title.component";
import { PageHeaderModule } from "../../../../../../core/src/shared/components/page-header/page-header.module";
import { SteppersModule } from "../../../../../../core/src/shared/components/stepper/steppers.module";
import { TabNavService } from "../../../../../../core/src/tab-nav.service";
import { EntityMonitorFactory } from "../../../../../../store/src/monitors/entity-monitor.factory.service";
import { InternalEventMonitorFactory } from "../../../../../../store/src/monitors/internal-event-monitor.factory";
import { PaginationMonitorFactory } from "../../../../../../store/src/monitors/pagination-monitor.factory";
import { generateCfBaseTestModulesNoShared } from "../../../../../test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from "../../../../features/service-catalog/services.service";
import { ServicesServiceMock } from "../../../../features/service-catalog/services.service.mock";
import { CfOrgSpaceDataService } from "../../../data-services/cf-org-space-service.service";
import { CloudFoundryService } from "../../../data-services/cloud-foundry.service";
import { LongRunningCfOperationsService } from "../../../data-services/long-running-cf-op.service";
import { AppNameUniqueDirective } from "../../../directives/app-name-unique.directive/app-name-unique.directive";
import { CfOrgSpaceLinksComponent } from "../../cf-org-space-links/cf-org-space-links.component";
import { CreateApplicationStep1Component } from "../../create-application/create-application-step1/create-application-step1.component";
import { CfServiceCardComponent } from "../../list/list-types/cf-services/cf-service-card/cf-service-card.component";
import { TableCellServiceActiveComponent } from "../../list/list-types/cf-services/table-cell-service-active/table-cell-service-active.component";
import { TableCellServiceBindableComponent } from "../../list/list-types/cf-services/table-cell-service-bindable/table-cell-service-bindable.component";
import { TableCellServiceCfBreadcrumbsComponent } from "../../list/list-types/cf-services/table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component";
import { TableCellServiceReferencesComponent } from "../../list/list-types/cf-services/table-cell-service-references/table-cell-service-references.component";
import { TableCellServiceTagsComponent } from "../../list/list-types/cf-services/table-cell-service-tags/table-cell-service-tags.component";
import { SchemaFormComponent } from "../../schema-form/schema-form.component";
import { SelectServiceComponent } from "../../select-service/select-service.component";
import { ServiceIconComponent } from "../../service-icon/service-icon.component";
import { ServicePlanPriceComponent } from "../../service-plan-price/service-plan-price.component";
import { ServicePlanPublicComponent } from "../../service-plan-public/service-plan-public.component";
import { BindAppsStepComponent } from "../bind-apps-step/bind-apps-step.component";
import { SelectPlanStepComponent } from "../select-plan-step/select-plan-step.component";
import { SpecifyDetailsStepComponent } from "../specify-details-step/specify-details-step.component";
import { SpecifyUserProvidedDetailsComponent } from "../specify-user-provided-details/specify-user-provided-details.component";
import { AddServiceInstanceComponent } from "./add-service-instance.component";

describe("AddServiceInstanceComponent", () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  class EntityMonitorFactoryMock {
    entity = {
      entity: {
        name: "test-app-entity",
        space_guid: "populatePaginationFromParent-space",
        space: {
          entity: {
            organization_guid: "populatePaginationFromParent-org"
          },
          metadata: {}
        }
      },
      metadata: {}
    };
    entityRequestInfo = getDefaultRequestState();

    monitor = {
      entity$: new Observable(subscriber => {
        subscriber.next(this.entity);
        subscriber.complete();
      }),
      entityRequest$: new Observable(subscriber => {
        subscriber.next(this.entityRequestInfo);
        subscriber.complete();
      })
    };

    create() {
      return this.monitor;
    }
  }

  beforeEach(
    waitForAsync(() => {
      const entityMap = new Map<
        EntityCatalogEntityConfig,
        Array<TestStoreEntity | string>
      >([]);

      const store = {
        createApplication: {},
        createServiceInstance: {
          cfGuid: "populatePaginationFromParent-cf",
          orgGuid: "populatePaginationFromParent-org",
          spaceGuid: "populatePaginationFromParent-space",
          name: "",
          servicePlanGuid: "",
          spaceScoped: false
        }
      };

      TestBed.configureTestingModule({
        declarations: [
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
          TableCellServiceTagsComponent
        ],
        imports: [
          ...generateCfBaseTestModulesNoShared(),
          PageHeaderModule,
          SteppersModule,
          MaterialDesignFrameworkModule
        ],
        providers: [
          { provide: ServicesService, useClass: ServicesServiceMock },
          { provide: EntityMonitorFactory, useClass: EntityMonitorFactoryMock },
          PaginationMonitorFactory,
          CfOrgSpaceDataService,
          InternalEventMonitorFactory,
          CloudFoundryService,
          TabNavService,
          LongRunningCfOperationsService,
          provideMockStore({
            initialState: { ...createEntityStoreState(entityMap), ...store }
          })
        ]
      });
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render bind services in service wall mode", () => {
    expect(component.modeService.isServicesWallMode()).toBe(true);
    expect(
      fixture.debugElement.query(By.css(".steppers__headers")).nativeElement
        .textContent
    ).not.toContain("Bind App");
  });

  it("should render bind services when in app services mode", () => {
    const route = TestBed.inject(ActivatedRoute);

    route.snapshot.params.id = "xxx";
    route.snapshot.params.endpointId = "yyy";

    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.modeService.isAppServicesMode()).toBe(true);

    expect(
      fixture.debugElement.query(By.css(".steppers__headers")).nativeElement
        .textContent
    ).toContain("Binding Params");
  });
});
