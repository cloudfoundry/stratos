import { BaseCF } from './cf-page.types';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../../core/core.module';
import {
  CFEndpointsListConfigService,
} from '../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { EndpointsListConfigService } from '../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { SharedModule } from '../../shared/shared.module';
import { AddOrganisationComponent } from './add-organisation/add-organisation.component';
import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryRoutingModule } from './cloud-foundry.routing';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { CloudFoundryService } from './services/cloud-foundry.service';
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
import { CloudFoundryEndpointService } from './services/cloud-foundry-endpoint.service';

@NgModule({
  imports: [CoreModule, SharedModule, CloudFoundryRoutingModule, RouterModule],
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
    AddOrganisationComponent,
    ManageUsersComponent,
    CloudFoundryOrganizationSummaryComponent,
    CloudFoundryOrganizationSpacesComponent,
    CloudFoundryOrganizationUsersComponent,
    CloudFoundryOrganizationBaseComponent
  ],
  providers: [
    CloudFoundryService,
    CFEndpointsListConfigService,
    EndpointsListConfigService
  ]
})
export class CloudFoundryModule { }
