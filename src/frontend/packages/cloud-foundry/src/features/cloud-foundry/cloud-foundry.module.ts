import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { CloudFoundrySharedModule } from '../../shared/cf-shared.module';
import {
  CFEndpointsListConfigService,
} from '../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { AddOrganizationComponent } from './add-organization/add-organization.component';
import {
  CreateOrganizationStepComponent,
} from './add-organization/create-organization-step/create-organization-step.component';
import { AddQuotaComponent } from './add-quota/add-quota.component';
import { CreateQuotaStepComponent } from './add-quota/create-quota-step/create-quota-step.component';
import { AddSpaceQuotaComponent } from './add-space-quota/add-space-quota.component';
import { CreateSpaceQuotaStepComponent } from './add-space-quota/create-space-quota-step/create-space-quota-step.component';
import { AddSpaceComponent } from './add-space/add-space.component';
import { CreateSpaceStepComponent } from './add-space/create-space-step/create-space-step.component';
import { ActiveRouteCfCell, ActiveRouteCfOrgSpace } from './cf-page.types';
import { CliInfoCloudFoundryComponent } from './cli-info-cloud-foundry/cli-info-cloud-foundry.component';
import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryRoutingModule } from './cloud-foundry.routing';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { EditOrganizationStepComponent } from './edit-organization/edit-organization-step/edit-organization-step.component';
import { EditOrganizationComponent } from './edit-organization/edit-organization.component';
import { EditQuotaStepComponent } from './edit-quota/edit-quota-step/edit-quota-step.component';
import { EditQuotaComponent } from './edit-quota/edit-quota.component';
import { EditSpaceQuotaStepComponent } from './edit-space-quota/edit-space-quota-step/edit-space-quota-step.component';
import { EditSpaceQuotaComponent } from './edit-space-quota/edit-space-quota.component';
import { EditSpaceStepComponent } from './edit-space/edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from './edit-space/edit-space.component';
import { QuotaDefinitionFormComponent } from './quota-definition-form/quota-definition-form.component';
import { QuotaDefinitionComponent } from './quota-definition/quota-definition.component';
import { CloudFoundryEndpointService } from './services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './services/cloud-foundry-organization.service';
import { SpaceQuotaDefinitionFormComponent } from './space-quota-definition-form/space-quota-definition-form.component';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition/space-quota-definition.component';
import { CfAdminAddUserWarningComponent } from './tabs/cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import { CloudFoundryBuildPacksComponent } from './tabs/cloud-foundry-build-packs/cloud-foundry-build-packs.component';
import {
  CloudFoundryCellAppsComponent,
} from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell-apps/cloud-foundry-cell-apps.component';
import {
  CloudFoundryCellBaseComponent,
} from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell-base/cloud-foundry-cell-base.component';
import {
  CloudFoundryCellChartsComponent,
} from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell-charts/cloud-foundry-cell-charts.component';
import {
  CloudFoundryCellSummaryComponent,
} from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell-summary/cloud-foundry-cell-summary.component';
import { CloudFoundryCellService } from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell.service';
import { CloudFoundryCellsComponent } from './tabs/cloud-foundry-cells/cloud-foundry-cells.component';
import { CloudFoundryEventsComponent } from './tabs/cloud-foundry-events/cloud-foundry-events.component';
import { CloudFoundryFeatureFlagsComponent } from './tabs/cloud-foundry-feature-flags/cloud-foundry-feature-flags.component';
import { CloudFoundryFirehoseComponent } from './tabs/cloud-foundry-firehose/cloud-foundry-firehose.component';
import {
  CloudFoundryOrganizationSpaceQuotasComponent,
} from './tabs/cloud-foundry-organization-space-quotas/cloud-foundry-organization-space-quotas.component';
import {
  CloudFoundryInviteUserLinkComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-invite-user-link/cloud-foundry-invite-user-link.component';
import {
  CloudFoundryOrganizationBaseComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-base/cloud-foundry-organization-base.component';
import {
  CloudFoundryOrganizationEventsComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-events/cloud-foundry-organization-events.component';
import {
  CloudFoundryOrganizationSpacesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/cloud-foundry-organization-spaces.component';
import {
  CloudFoundrySpaceBaseComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/cloud-foundry-space-base/cloud-foundry-space-base.component';
import {
  CloudFoundrySpaceAppsComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-apps/cloud-foundry-space-apps.component';
import {
  CloudFoundrySpaceEventsComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-events/cloud-foundry-space-events.component';
import {
  CloudFoundrySpaceRoutesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-routes/cloud-foundry-space-routes.component';
import {
  CloudFoundrySpaceServiceInstancesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-service-instances/cloud-foundry-space-service-instances.component';
import {
  CloudFoundrySpaceSummaryComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-summary/cloud-foundry-space-summary.component';
import {
  CloudFoundrySpaceUserServiceInstancesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-user-service-instances/cloud-foundry-space-user-service-instances.component';
import {
  CloudFoundrySpaceUsersComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-users/cloud-foundry-space-users.component';
import {
  CloudFoundryOrganizationSummaryComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-summary/cloud-foundry-organization-summary.component';
import {
  CloudFoundryOrganizationUsersComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-users/cloud-foundry-organization-users.component';
import {
  CloudFoundryOrganizationsComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organizations.component';
import { CloudFoundryQuotasComponent } from './tabs/cloud-foundry-quotas/cloud-foundry-quotas.component';
import { CloudFoundryRoutesComponent } from './tabs/cloud-foundry-routes/cloud-foundry-routes.component';
import {
  CloudFoundrySecurityGroupsComponent,
} from './tabs/cloud-foundry-security-groups/cloud-foundry-security-groups.component';
import { CloudFoundryStacksComponent } from './tabs/cloud-foundry-stacks/cloud-foundry-stacks.component';
import { CloudFoundrySummaryTabComponent } from './tabs/cloud-foundry-summary-tab/cloud-foundry-summary-tab.component';
import { CloudFoundryUsersComponent } from './tabs/cloud-foundry-users/cloud-foundry-users.component';
import {
  UserInviteConfigurationDialogComponent,
} from './user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteConfigureService, UserInviteService } from './user-invites/user-invite.service';
import { InviteUsersCreateComponent } from './users/invite-users/invite-users-create/invite-users-create.component';
import { InviteUsersComponent } from './users/invite-users/invite-users.component';
import { UsersRolesConfirmComponent } from './users/manage-users/manage-users-confirm/manage-users-confirm.component';
import { UsersRolesModifyComponent } from './users/manage-users/manage-users-modify/manage-users-modify.component';
import {
  SpaceRolesListWrapperComponent,
} from './users/manage-users/manage-users-modify/space-roles-list-wrapper/space-roles-list-wrapper.component';
import { UsersRolesSelectComponent } from './users/manage-users/manage-users-select/manage-users-select.component';
import {
  ManageUsersSetUsernamesComponent,
} from './users/manage-users/manage-users-set-usernames/manage-users-set-usernames.component';
import { UsersRolesComponent } from './users/manage-users/manage-users.component';
import { RemoveUserComponent } from './users/remove-user/remove-user.component';

/* tslint:disable:max-line-length */

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    CloudFoundryRoutingModule,
    RouterModule,
    NgxChartsModule,
    CloudFoundrySharedModule
  ],
  declarations: [
    CloudFoundryBaseComponent,
    CloudFoundryTabsBaseComponent,
    CloudFoundryComponent,
    CloudFoundrySummaryTabComponent,
    CloudFoundryOrganizationsComponent,
    CloudFoundryUsersComponent,
    CloudFoundryFirehoseComponent,
    CloudFoundryFeatureFlagsComponent,
    CloudFoundryCellsComponent,
    CloudFoundryCellBaseComponent,
    CloudFoundryCellSummaryComponent,
    CloudFoundryCellAppsComponent,
    CloudFoundryCellChartsComponent,
    CloudFoundryBuildPacksComponent,
    CloudFoundryStacksComponent,
    CloudFoundrySecurityGroupsComponent,
    CloudFoundryQuotasComponent,
    CloudFoundryOrganizationSpaceQuotasComponent,
    AddOrganizationComponent,
    AddQuotaComponent,
    EditQuotaComponent,
    EditQuotaStepComponent,
    EditSpaceQuotaComponent,
    EditSpaceQuotaStepComponent,
    AddSpaceQuotaComponent,
    QuotaDefinitionFormComponent,
    SpaceQuotaDefinitionFormComponent,
    UsersRolesComponent,
    CloudFoundryOrganizationSummaryComponent,
    CloudFoundryOrganizationSpacesComponent,
    CloudFoundryOrganizationUsersComponent,
    CloudFoundryOrganizationBaseComponent,
    EditSpaceComponent,
    AddSpaceComponent,
    CloudFoundrySpaceSummaryComponent,
    CloudFoundrySpaceBaseComponent,
    CloudFoundrySpaceAppsComponent,
    CloudFoundrySpaceServiceInstancesComponent,
    CloudFoundrySpaceUserServiceInstancesComponent,
    CloudFoundrySpaceRoutesComponent,
    CloudFoundrySpaceUsersComponent,
    EditSpaceStepComponent,
    CreateSpaceStepComponent,
    CreateOrganizationStepComponent,
    CreateQuotaStepComponent,
    CreateSpaceQuotaStepComponent,
    EditOrganizationComponent,
    EditOrganizationStepComponent,
    CliInfoCloudFoundryComponent,
    UsersRolesModifyComponent,
    SpaceRolesListWrapperComponent,
    UsersRolesSelectComponent,
    UsersRolesConfirmComponent,
    CloudFoundryRoutesComponent,
    UserInviteConfigurationDialogComponent,
    InviteUsersComponent,
    InviteUsersCreateComponent,
    RemoveUserComponent,
    CloudFoundryInviteUserLinkComponent,
    CfAdminAddUserWarningComponent,
    QuotaDefinitionComponent,
    SpaceQuotaDefinitionComponent,
    CloudFoundryEventsComponent,
    CloudFoundryOrganizationEventsComponent,
    CloudFoundrySpaceEventsComponent,
    ManageUsersSetUsernamesComponent,
  ],
  providers: [
    CFEndpointsListConfigService,
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: {}
    },
    {
      provide: ActiveRouteCfCell,
      useValue: {}
    },
    // ApplicationService,
    // CloudFoundrySpaceService,
    CloudFoundryOrganizationService,
    CloudFoundryEndpointService,
    // CfRolesService,
    CloudFoundryCellService,
    UserInviteService,
    UserInviteConfigureService,
  ],
  entryComponents: [
    UserInviteConfigurationDialogComponent
  ]
})
export class CloudFoundryModule { }
