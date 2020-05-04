import { CommonModule } from '@angular/common';
import { ApplicationModule, NgModule, Type } from '@angular/core';
import { MaterialDesignFrameworkModule } from 'stratos-angular6-json-schema-form';

import { CoreModule } from '../../../../core/src/core/core.module';
import {
  TableCellQuotaComponent,
} from '../../../../core/src/shared/components/list/list-types/cf-quotas/table-cell-quota/table-cell-quota.component';
import {
  TableCellServiceLastOpComponent,
} from '../../../../core/src/shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-last-op/table-cell-service-last-op.component';
import {
  TableCellServiceComponent,
} from '../../../../core/src/shared/components/list/list-types/cf-spaces-service-instances/table-cell-service/table-cell-service.component';
import { CardCell, TableCellCustom } from '../../../../core/src/shared/components/list/list.types';
import {
  ServiceInstanceLastOpComponent,
} from '../../../../core/src/shared/components/service-instance-last-op/service-instance-last-op.component';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import {
  AddServiceInstanceBaseStepComponent,
} from './add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import { AddServiceInstanceComponent } from './add-service-instance/add-service-instance/add-service-instance.component';
import { BindAppsStepComponent } from './add-service-instance/bind-apps-step/bind-apps-step.component';
import { NoServicePlansComponent } from './add-service-instance/no-service-plans/no-service-plans.component';
import { SelectPlanStepComponent } from './add-service-instance/select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from './add-service-instance/specify-details-step/specify-details-step.component';
import {
  SpecifyUserProvidedDetailsComponent,
} from './add-service-instance/specify-user-provided-details/specify-user-provided-details.component';
import { CardAppInstancesComponent } from './cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from './cards/card-app-status/card-app-status.component';
import { CardAppUptimeComponent } from './cards/card-app-uptime/card-app-uptime.component';
import { CardAppUsageComponent } from './cards/card-app-usage/card-app-usage.component';
import { CardCfInfoComponent } from './cards/card-cf-info/card-cf-info.component';
import { CardCfOrgUserDetailsComponent } from './cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { CardCfRecentAppsComponent } from './cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from './cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CardCfSpaceDetailsComponent } from './cards/card-cf-space-details/card-cf-space-details.component';
import { CardCfUserInfoComponent } from './cards/card-cf-user-info/card-cf-user-info.component';
import {
  CompactServiceInstanceCardComponent,
} from './cards/compact-service-instance-card/compact-service-instance-card.component';
import { ServiceBrokerCardComponent } from './cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from './cards/service-recent-instances-card/service-recent-instances-card.component';
import { ServiceSummaryCardComponent } from './cards/service-summary-card/service-summary-card.component';
import { CfEndpointDetailsComponent } from './cf-endpoint-details/cf-endpoint-details.component';
import { CfEndpointsMissingComponent } from './cf-endpoints-missing/cf-endpoints-missing.component';
import { CfOrgSpaceLinksComponent } from './cf-org-space-links/cf-org-space-links.component';
import { CfRoleCheckboxComponent } from './cf-role-checkbox/cf-role-checkbox.component';
import { CliCommandComponent } from './cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from './cli-info/cli-info.component';
import { CloudFoundryEventsListComponent } from './cloud-foundry-events-list/cloud-foundry-events-list.component';
import {
  CreateApplicationStep1Component,
} from './create-application/create-application-step1/create-application-step1.component';
import { TableCellCfCellComponent } from './list/list-types/app-instance/table-cell-cf-cell/table-cell-cf-cell.component';
import { TableCellUsageComponent } from './list/list-types/app-instance/table-cell-usage/table-cell-usage.component';
import {
  AppServiceBindingCardComponent,
} from './list/list-types/app-sevice-bindings/app-service-binding-card/app-service-binding-card.component';
import {
  TableCellEditVariableComponent,
} from './list/list-types/app-variables/table-cell-edit-variable/table-cell-edit-variable.component';
import { CardAppComponent } from './list/list-types/app/card/card-app.component';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from './list/list-types/app/table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import {
  TableCellAppCfOrgSpaceComponent,
} from './list/list-types/app/table-cell-app-cforgspace/table-cell-app-cforgspace.component';
import {
  TableCellAppInstancesComponent,
} from './list/list-types/app/table-cell-app-instances/table-cell-app-instances.component';
import { TableCellAppNameComponent } from './list/list-types/app/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from './list/list-types/app/table-cell-app-status/table-cell-app-status.component';
import { CfBuildpackCardComponent } from './list/list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import {
  TableCellConfirmOrgSpaceComponent,
} from './list/list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent,
} from './list/list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { EventMetadataComponent } from './list/list-types/cf-events/event-metadata/event-metadata.component';
import {
  TableCellEventActeeComponent,
} from './list/list-types/cf-events/table-cell-event-actee/table-cell-event-actee.component';
import { EventTabActorIconPipe } from './list/list-types/cf-events/table-cell-event-action/event-tab-actor-icon.pipe';
import {
  TableCellEventActionComponent,
} from './list/list-types/cf-events/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from './list/list-types/cf-events/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from './list/list-types/cf-events/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from './list/list-types/cf-events/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellFeatureFlagDescriptionComponent,
} from './list/list-types/cf-feature-flags/table-cell-feature-flag-description/table-cell-feature-flag-description.component';
import {
  TableCellFeatureFlagStateComponent,
} from './list/list-types/cf-feature-flags/table-cell-feature-flag-state/table-cell-feature-flag-state.component';
import { CfOrgCardComponent } from './list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import {
  TableCellRouteAppsAttachedComponent,
} from './list/list-types/cf-routes/table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { TableCellRouteComponent } from './list/list-types/cf-routes/table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from './list/list-types/cf-routes/table-cell-tcproute/table-cell-tcproute.component';
import {
  CfSecurityGroupsCardComponent,
} from './list/list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { CfServiceCardComponent } from './list/list-types/cf-services/cf-service-card/cf-service-card.component';
import {
  TableCellServiceActiveComponent,
} from './list/list-types/cf-services/table-cell-service-active/table-cell-service-active.component';
import {
  TableCellServiceBindableComponent,
} from './list/list-types/cf-services/table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from './list/list-types/cf-services/table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import {
  TableCellServiceProviderComponent,
} from './list/list-types/cf-services/table-cell-service-provider/table-cell-service-provider.component';
import {
  TableCellServiceReferencesComponent,
} from './list/list-types/cf-services/table-cell-service-references/table-cell-service-references.component';
import {
  TableCellServiceTagsComponent,
} from './list/list-types/cf-services/table-cell-service-tags/table-cell-service-tags.component';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from './list/list-types/cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from './list/list-types/cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellSpaceNameComponent,
} from './list/list-types/cf-spaces-service-instances/table-cell-space-name/table-cell-space-name.component';
import { CfSpaceCardComponent } from './list/list-types/cf-spaces/cf-space-card/cf-space-card.component';
import { CfStacksCardComponent } from './list/list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import {
  TableCellRoleOrgSpaceComponent,
} from './list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from './list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import {
  CfOrgPermissionCellComponent,
} from './list/list-types/cf-users/cf-org-permission-cell/cf-org-permission-cell.component';
import {
  CfSpacePermissionCellComponent,
} from './list/list-types/cf-users/cf-space-permission-cell/cf-space-permission-cell.component';
import {
  TableCellAServicePlanExtrasComponent,
} from './list/list-types/service-plans/table-cell-service-plan-extras/table-cell-service-plan-extras.component';
import {
  TableCellAServicePlanPriceComponent,
} from './list/list-types/service-plans/table-cell-service-plan-price/table-cell-service-plan-price.component';
import {
  TableCellAServicePlanPublicComponent,
} from './list/list-types/service-plans/table-cell-service-plan-public/table-cell-service-plan-public.component';
import {
  ServiceInstanceCardComponent,
} from './list/list-types/services-wall/service-instance-card/service-instance-card.component';
import {
  UserProvidedServiceInstanceCardComponent,
} from './list/list-types/services-wall/user-provided-service-instance-card/user-provided-service-instance-card.component';
import { RunningInstancesComponent } from './running-instances/running-instances.component';
import { SchemaFormComponent } from './schema-form/schema-form.component';
import { SelectServiceComponent } from './select-service/select-service.component';
import { ServiceIconComponent } from './service-icon/service-icon.component';
import { ServicePlanPriceComponent } from './service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from './service-plan-public/service-plan-public.component';

// tslint:disable:max-line-length
// tslint:enable:max-line-length

const cfListTableCells: Type<TableCellCustom<any>>[] = [
  TableCellServiceInstanceAppsAttachedComponent,
  TableCellServiceComponent,
  TableCellServiceLastOpComponent,
  TableCellRouteAppsAttachedComponent,
  CfOrgPermissionCellComponent,
  CfSpacePermissionCellComponent,
  TableCellFeatureFlagStateComponent,
  TableCellFeatureFlagDescriptionComponent,
  TableCellConfirmOrgSpaceComponent,
  TableCellSelectOrgComponent,
  TableCellAppStatusComponent,
  TableCellRoleOrgSpaceComponent,
  TableCellConfirmRoleAddRemComponent,
  TableCellSpaceNameComponent,
  TableCellAppCfOrgSpaceHeaderComponent,
  TableCellAppCfOrgSpaceComponent,
  TableCellAServicePlanPublicComponent,
  TableCellAServicePlanPriceComponent,
  TableCellAServicePlanExtrasComponent,
  TableCellCfCellComponent,
  TableCellRouteComponent,
  TableCellTCPRouteComponent,
  TableCellAppInstancesComponent,
  TableCellAppNameComponent,
  TableCellEditVariableComponent,
  TableCellEventTimestampComponent,
  TableCellEventTypeComponent,
  TableCellEventActionComponent,
  TableCellEventDetailComponent,
  TableCellUsageComponent,
  TableCellQuotaComponent,
  TableCellEventActeeComponent,
  TableCellServiceTagsComponent,
  TableCellServiceCfBreadcrumbsComponent,
  TableCellServiceProviderComponent,
  TableCellServiceBindableComponent,
  TableCellServiceActiveComponent,
  TableCellServiceReferencesComponent,
  TableCellServiceInstanceTagsComponent,
];

const cfListCards: Type<CardCell<any>>[] = [
  AppServiceBindingCardComponent,
  CardAppComponent,
  CfOrgCardComponent,
  CfSpaceCardComponent,
  CfBuildpackCardComponent,
  CfSecurityGroupsCardComponent,
  CfStacksCardComponent,
  CfServiceCardComponent,
  ServiceInstanceCardComponent,
  UserProvidedServiceInstanceCardComponent,
];

// listTableCells.push();

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    ApplicationModule,
    MaterialDesignFrameworkModule,
  ],
  declarations: [
    ServiceIconComponent,
    CfEndpointDetailsComponent,
    CliCommandComponent,
    CliInfoComponent,
    CfEndpointsMissingComponent,
    CfRoleCheckboxComponent,
    CfOrgSpaceLinksComponent,
    SelectServiceComponent,
    SpecifyDetailsStepComponent,
    AddServiceInstanceComponent,
    SelectPlanStepComponent,
    NoServicePlansComponent,
    BindAppsStepComponent,
    SpecifyUserProvidedDetailsComponent,
    AddServiceInstanceBaseStepComponent,
    SchemaFormComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUsageComponent,
    CardAppUptimeComponent,
    CardCfInfoComponent,
    CardCfUserInfoComponent,
    CardCfOrgUserDetailsComponent,
    CardCfSpaceDetailsComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
    CompactServiceInstanceCardComponent,
    RunningInstancesComponent,
    ServicePlanPublicComponent,
    ServicePlanPriceComponent,
    CreateApplicationStep1Component,
    EventTabActorIconPipe,
    CloudFoundryEventsListComponent,
    EventMetadataComponent,
    ...cfListTableCells,
    ...cfListCards,
    ServiceInstanceLastOpComponent,
    TableCellFeatureFlagDescriptionComponent
  ],
  exports: [
    ServiceIconComponent,
    CfEndpointDetailsComponent,
    CliCommandComponent,
    CliInfoComponent,
    CfEndpointsMissingComponent,
    CfRoleCheckboxComponent,
    CfOrgSpaceLinksComponent,
    SelectServiceComponent,
    SpecifyDetailsStepComponent,
    AddServiceInstanceComponent,
    SelectPlanStepComponent,
    NoServicePlansComponent,
    BindAppsStepComponent,
    SpecifyUserProvidedDetailsComponent,
    AddServiceInstanceBaseStepComponent,
    CfServiceCardComponent,
    SchemaFormComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUsageComponent,
    CardAppUptimeComponent,
    CardCfInfoComponent,
    CardCfUserInfoComponent,
    CardCfOrgUserDetailsComponent,
    CardCfSpaceDetailsComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
    CompactServiceInstanceCardComponent,
    RunningInstancesComponent,
    ServicePlanPublicComponent,
    ServicePlanPriceComponent,
    CreateApplicationStep1Component,
    CloudFoundryEventsListComponent
  ],
  entryComponents: [
    CfEndpointDetailsComponent,
    NoServicePlansComponent,
    EventMetadataComponent,

    ...cfListTableCells,
    ...cfListCards
  ]
})
export class CloudFoundryComponentsModule { }
