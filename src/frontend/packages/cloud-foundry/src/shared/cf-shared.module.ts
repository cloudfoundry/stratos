import { CommonModule } from '@angular/common';
import { ApplicationModule, NgModule, Type } from '@angular/core';
import { MaterialDesignFrameworkModule } from '@cfstratos/ajsf-material';

import { CoreModule } from '../../../core/src/core/core.module';
import { CardCell, TableCellCustom } from '../../../core/src/shared/components/list/list.types';
import { SharedModule } from '../../../core/src/shared/shared.module';
import {
  ApplicationInstanceChartComponent,
} from '../features/applications/application/application-instance-chart/application-instance-chart.component';
import {
  AddServiceInstanceBaseStepComponent,
} from './components/add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import {
  AddServiceInstanceComponent,
} from './components/add-service-instance/add-service-instance/add-service-instance.component';
import { BindAppsStepComponent } from './components/add-service-instance/bind-apps-step/bind-apps-step.component';
import { NoServicePlansComponent } from './components/add-service-instance/no-service-plans/no-service-plans.component';
import { SelectPlanStepComponent } from './components/add-service-instance/select-plan-step/select-plan-step.component';
import {
  SpecifyDetailsStepComponent,
} from './components/add-service-instance/specify-details-step/specify-details-step.component';
import {
  SpecifyUserProvidedDetailsComponent,
} from './components/add-service-instance/specify-user-provided-details/specify-user-provided-details.component';
import { CardAppInstancesComponent } from './components/cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from './components/cards/card-app-status/card-app-status.component';
import { CardAppUptimeComponent } from './components/cards/card-app-uptime/card-app-uptime.component';
import { CardAppUsageComponent } from './components/cards/card-app-usage/card-app-usage.component';
import { CardCfInfoComponent } from './components/cards/card-cf-info/card-cf-info.component';
import {
  CardCfOrgUserDetailsComponent,
} from './components/cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { CardCfRecentAppsComponent } from './components/cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from './components/cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CardCfSpaceDetailsComponent } from './components/cards/card-cf-space-details/card-cf-space-details.component';
import { CardCfUserInfoComponent } from './components/cards/card-cf-user-info/card-cf-user-info.component';
import {
  CompactServiceInstanceCardComponent,
} from './components/cards/compact-service-instance-card/compact-service-instance-card.component';
import { ServiceBrokerCardComponent } from './components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from './components/cards/service-recent-instances-card/service-recent-instances-card.component';
import { ServiceSummaryCardComponent } from './components/cards/service-summary-card/service-summary-card.component';
import { CfEndpointDetailsComponent } from './components/cf-endpoint-details/cf-endpoint-details.component';
import { CfEndpointsMissingComponent } from './components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfOrgSpaceLinksComponent } from './components/cf-org-space-links/cf-org-space-links.component';
import { CfRoleCheckboxComponent } from './components/cf-role-checkbox/cf-role-checkbox.component';
import { CliCommandComponent } from './components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from './components/cli-info/cli-info.component';
import { CloudFoundryEventsListComponent } from './components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import {
  CreateApplicationStep1Component,
} from './components/create-application/create-application-step1/create-application-step1.component';
import { EnvVarViewComponent } from './components/env-var-view/env-var-view.component';
import { GithubCommitAuthorComponent } from './components/github-commit-author/github-commit-author.component';
import {
  TableCellCfCellComponent,
} from './components/list/list-types/app-instance/table-cell-cf-cell/table-cell-cf-cell.component';
import {
  TableCellUsageComponent,
} from './components/list/list-types/app-instance/table-cell-usage/table-cell-usage.component';
import {
  AppServiceBindingCardComponent,
} from './components/list/list-types/app-sevice-bindings/app-service-binding-card/app-service-binding-card.component';
import {
  TableCellEditVariableComponent,
} from './components/list/list-types/app-variables/table-cell-edit-variable/table-cell-edit-variable.component';
import { CardAppComponent } from './components/list/list-types/app/card/card-app.component';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from './components/list/list-types/app/table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import {
  TableCellAppCfOrgSpaceComponent,
} from './components/list/list-types/app/table-cell-app-cforgspace/table-cell-app-cforgspace.component';
import {
  TableCellAppInstancesComponent,
} from './components/list/list-types/app/table-cell-app-instances/table-cell-app-instances.component';
import {
  TableCellAppNameComponent,
} from './components/list/list-types/app/table-cell-app-name/table-cell-app-name.component';
import {
  TableCellAppStatusComponent,
} from './components/list/list-types/app/table-cell-app-status/table-cell-app-status.component';
import {
  CfBuildpackCardComponent,
} from './components/list/list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import {
  TableCellConfirmOrgSpaceComponent,
} from './components/list/list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent,
} from './components/list/list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { EventMetadataComponent } from './components/list/list-types/cf-events/event-metadata/event-metadata.component';
import {
  TableCellEventActeeComponent,
} from './components/list/list-types/cf-events/table-cell-event-actee/table-cell-event-actee.component';
import {
  EventTabActorIconPipe,
} from './components/list/list-types/cf-events/table-cell-event-action/event-tab-actor-icon.pipe';
import {
  TableCellEventActionComponent,
} from './components/list/list-types/cf-events/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from './components/list/list-types/cf-events/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from './components/list/list-types/cf-events/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from './components/list/list-types/cf-events/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellFeatureFlagDescriptionComponent,
} from './components/list/list-types/cf-feature-flags/table-cell-feature-flag-description/table-cell-feature-flag-description.component';
import {
  TableCellFeatureFlagStateComponent,
} from './components/list/list-types/cf-feature-flags/table-cell-feature-flag-state/table-cell-feature-flag-state.component';
import { CfOrgCardComponent } from './components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { TableCellQuotaComponent } from './components/list/list-types/cf-quotas/table-cell-quota/table-cell-quota.component';
import {
  TableCellRouteAppsAttachedComponent,
} from './components/list/list-types/cf-routes/table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { TableCellRouteComponent } from './components/list/list-types/cf-routes/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from './components/list/list-types/cf-routes/table-cell-tcproute/table-cell-tcproute.component';
import {
  CfSecurityGroupsCardComponent,
} from './components/list/list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { CfServiceCardComponent } from './components/list/list-types/cf-services/cf-service-card/cf-service-card.component';
import {
  TableCellServiceActiveComponent,
} from './components/list/list-types/cf-services/table-cell-service-active/table-cell-service-active.component';
import {
  TableCellServiceBindableComponent,
} from './components/list/list-types/cf-services/table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from './components/list/list-types/cf-services/table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import {
  TableCellServiceProviderComponent,
} from './components/list/list-types/cf-services/table-cell-service-provider/table-cell-service-provider.component';
import {
  TableCellServiceReferencesComponent,
} from './components/list/list-types/cf-services/table-cell-service-references/table-cell-service-references.component';
import {
  TableCellServiceTagsComponent,
} from './components/list/list-types/cf-services/table-cell-service-tags/table-cell-service-tags.component';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from './components/list/list-types/cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from './components/list/list-types/cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellServiceLastOpComponent,
} from './components/list/list-types/cf-spaces-service-instances/table-cell-service-last-op/table-cell-service-last-op.component';
import {
  TableCellServiceComponent,
} from './components/list/list-types/cf-spaces-service-instances/table-cell-service/table-cell-service.component';
import {
  TableCellSpaceNameComponent,
} from './components/list/list-types/cf-spaces-service-instances/table-cell-space-name/table-cell-space-name.component';
import { CfSpaceCardComponent } from './components/list/list-types/cf-spaces/cf-space-card/cf-space-card.component';
import { CfStacksCardComponent } from './components/list/list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import {
  TableCellRoleOrgSpaceComponent,
} from './components/list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from './components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import {
  CfOrgPermissionCellComponent,
} from './components/list/list-types/cf-users/cf-org-permission-cell/cf-org-permission-cell.component';
import {
  CfSpacePermissionCellComponent,
} from './components/list/list-types/cf-users/cf-space-permission-cell/cf-space-permission-cell.component';
import {
  TableCellCommitAuthorComponent,
} from './components/list/list-types/github-commits/table-cell-commit-author/table-cell-commit-author.component';
import {
  TableCellAServicePlanExtrasComponent,
} from './components/list/list-types/service-plans/table-cell-service-plan-extras/table-cell-service-plan-extras.component';
import {
  TableCellAServicePlanPriceComponent,
} from './components/list/list-types/service-plans/table-cell-service-plan-price/table-cell-service-plan-price.component';
import {
  TableCellAServicePlanPublicComponent,
} from './components/list/list-types/service-plans/table-cell-service-plan-public/table-cell-service-plan-public.component';
import {
  ServiceInstanceCardComponent,
} from './components/list/list-types/services-wall/service-instance-card/service-instance-card.component';
import {
  UserProvidedServiceInstanceCardComponent,
} from './components/list/list-types/services-wall/user-provided-service-instance-card/user-provided-service-instance-card.component';
import { RunningInstancesComponent } from './components/running-instances/running-instances.component';
import { SchemaFormComponent } from './components/schema-form/schema-form.component';
import { SelectServiceComponent } from './components/select-service/select-service.component';
import { ServiceIconComponent } from './components/service-icon/service-icon.component';
import { ServiceInstanceLastOpComponent } from './components/service-instance-last-op/service-instance-last-op.component';
import { ServicePlanPriceComponent } from './components/service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from './components/service-plan-public/service-plan-public.component';
import { GitSCMService } from './data-services/scm/scm.service';
import { AppNameUniqueDirective } from './directives/app-name-unique.directive/app-name-unique.directive';
import { CfUserPermissionDirective } from './directives/cf-user-permission/cf-user-permission.directive';
import { ApplicationStateService } from './services/application-state.service';
import { CloudFoundryUserProvidedServicesService } from './services/cloud-foundry-user-provided-services.service';

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
  TableCellCommitAuthorComponent,
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
    TableCellFeatureFlagDescriptionComponent,
    AppNameUniqueDirective,
    ApplicationInstanceChartComponent,
    GithubCommitAuthorComponent,
    EnvVarViewComponent,
    CfUserPermissionDirective
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
    CloudFoundryEventsListComponent,
    AppNameUniqueDirective,
    ApplicationInstanceChartComponent,
    GithubCommitAuthorComponent,
    EnvVarViewComponent,
    CfUserPermissionDirective
  ],
  entryComponents: [
    CfEndpointDetailsComponent,
    NoServicePlansComponent,
    EventMetadataComponent,
    EnvVarViewComponent,
    ...cfListTableCells,
    ...cfListCards
  ],
  providers: [
    ApplicationStateService,
    GitSCMService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundrySharedModule { }

