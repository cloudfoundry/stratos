
/* tslint:disable:max-line-length */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../core/core.module';
import {
  CFEndpointsListConfigService,
} from '../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { EndpointsListConfigService } from '../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { SharedModule } from '../../shared/shared.module';
import { AddOrganizationComponent } from './add-organization/add-organization.component';
import {
  CreateOrganizationStepComponent,
} from './add-organization/create-organization-step/create-organization-step.component';
import { AddSpaceComponent } from './add-space/add-space.component';
import { CreateSpaceStepComponent } from './add-space/create-space-step/create-space-step.component';
import { ActiveRouteCfOrgSpace } from './cf-page.types';
import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryRoutingModule } from './cloud-foundry.routing';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { EditOrganizationStepComponent } from './edit-organization/edit-organization-step/edit-organization-step.component';
import { EditOrganizationComponent } from './edit-organization/edit-organization.component';
import { EditSpaceStepComponent } from './edit-space/edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from './edit-space/edit-space.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { CloudFoundryEndpointService } from './services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './services/cloud-foundry-organization.service';
import { CloudFoundryBuildPacksComponent } from './tabs/cloud-foundry-build-packs/cloud-foundry-build-packs.component';
import { CloudFoundryFeatureFlagsComponent } from './tabs/cloud-foundry-feature-flags/cloud-foundry-feature-flags.component';
import { CloudFoundryFirehoseComponent } from './tabs/cloud-foundry-firehose/cloud-foundry-firehose.component';
import {
  CloudFoundryOrganizationBaseComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-base/cloud-foundry-organization-base.component';
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
  CloudFoundrySpaceRoutesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-routes/cloud-foundry-space-routes.component';
import {
  CloudFoundrySpaceServiceInstancesComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-service-instances/cloud-foundry-space-service-instances.component';
import {
  CloudFoundrySpaceSummaryComponent,
} from './tabs/cloud-foundry-organizations/cloud-foundry-organization-spaces/tabs/cloud-foundry-space-summary/cloud-foundry-space-summary.component';
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
import {
  CloudFoundrySecurityGroupsComponent,
} from './tabs/cloud-foundry-security-groups/cloud-foundry-security-groups.component';
import { CloudFoundryStacksComponent } from './tabs/cloud-foundry-stacks/cloud-foundry-stacks.component';
import { CloudFoundrySummaryTabComponent } from './tabs/cloud-foundry-summary-tab/cloud-foundry-summary-tab.component';
import { CloudFoundryUsersComponent } from './tabs/cloud-foundry-users/cloud-foundry-users.component';

@NgModule({
  imports: [CoreModule, SharedModule, CloudFoundryRoutingModule, RouterModule, NgxChartsModule],
  declarations: [
    CloudFoundryBaseComponent,
    CloudFoundryTabsBaseComponent,
    CloudFoundryComponent,
    CloudFoundrySummaryTabComponent,
    CloudFoundryOrganizationsComponent,
    CloudFoundryUsersComponent,
    CloudFoundryFirehoseComponent,
    CloudFoundryFeatureFlagsComponent,
    CloudFoundryBuildPacksComponent,
    CloudFoundryStacksComponent,
    CloudFoundrySecurityGroupsComponent,
    AddOrganizationComponent,
    ManageUsersComponent,
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
    CloudFoundrySpaceRoutesComponent,
    CloudFoundrySpaceUsersComponent,
    EditSpaceStepComponent,
    CreateSpaceStepComponent,
    CreateOrganizationStepComponent,
    EditOrganizationComponent,
    EditOrganizationStepComponent
  ],
  providers: [
    CFEndpointsListConfigService,
    EndpointsListConfigService,
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: {}
    },
    CloudFoundryOrganizationService,
    CloudFoundryEndpointService
  ]
})
export class CloudFoundryModule { }
