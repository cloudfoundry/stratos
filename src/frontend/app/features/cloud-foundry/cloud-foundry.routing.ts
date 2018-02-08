import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { CloudFoundrySummaryTabComponent } from './tabs/cloud-foundry-summary-tab/cloud-foundry-summary-tab.component';
import { CloudFoundryOrganizationsComponent } from './tabs/cloud-foundry-organizations/cloud-foundry-organizations.component';
import { CloudFoundryUsersComponent } from './tabs/cloud-foundry-users/cloud-foundry-users.component';
import { CloudFoundryFirehoseComponent } from './tabs/cloud-foundry-firehose/cloud-foundry-firehose.component';
import { CloudFoundryFeatureFlagsComponent } from './tabs/cloud-foundry-feature-flags/cloud-foundry-feature-flags.component';
import { CloudFoundryBuildPacksComponent } from './tabs/cloud-foundry-build-packs/cloud-foundry-build-packs.component';
import { CloudFoundryStacksComponent } from './tabs/cloud-foundry-stacks/cloud-foundry-stacks.component';
import { CloudFoundrySecurityGroupsComponent } from './tabs/cloud-foundry-security-groups/cloud-foundry-security-groups.component';
import { AddOrganisationComponent } from './add-organisation/add-organisation.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';

const cloudFoundry: Routes = [
  { path: '', component: CloudFoundryComponent },
  {
    path: ':cfId',
    children: [
      {
        path: '',
        // Root for attaching CF wide actions (i.e assignments, tabs)
        component: CloudFoundryBaseComponent,
        children: [
          {
            path: '',
            // Root for Tabs
            component: CloudFoundryTabsBaseComponent,
            data: {
              uiFullView: true
            },
            children: [
              {
                path: '',
                redirectTo: 'summary',
                pathMatch: 'full'
              },
              {
                path: 'summary',
                component: CloudFoundrySummaryTabComponent
              },
              {
                path: 'organizations',
                component: CloudFoundryOrganizationsComponent
              },
              {
                path: 'users',
                component: CloudFoundryUsersComponent
              },
              {
                path: 'firehose',
                component: CloudFoundryFirehoseComponent
              },
              {
                path: 'feature-flags',
                component: CloudFoundryFeatureFlagsComponent
              },
              {
                path: 'build-packs',
                component: CloudFoundryBuildPacksComponent
              },
              {
                path: 'stacks',
                component: CloudFoundryStacksComponent
              },
              {
                path: 'security-groups',
                component: CloudFoundrySecurityGroupsComponent
              }
            ]
          }
        ]
      },
      {
        path: 'add-org',
        component: AddOrganisationComponent
      },
      {
        path: 'manage-users',
        component: ManageUsersComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(cloudFoundry)]
})
export class CloudFoundryRoutingModule {}
