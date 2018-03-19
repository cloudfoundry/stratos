import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddOrganizationComponent } from './add-organization/add-organization.component';
import { AddSpaceComponent } from './add-space/add-space.component';
import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { EditSpaceComponent } from './edit-space/edit-space.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
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
/* tslint:disable:max-line-length */
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
/* tslint:enable:max-line-length */
import { CloudFoundryStacksComponent } from './tabs/cloud-foundry-stacks/cloud-foundry-stacks.component';
import { CloudFoundrySummaryTabComponent } from './tabs/cloud-foundry-summary-tab/cloud-foundry-summary-tab.component';
import { CloudFoundryUsersComponent } from './tabs/cloud-foundry-users/cloud-foundry-users.component';
import { EditOrganizationComponent } from './edit-organization/edit-organization.component';

const cloudFoundry: Routes = [{
  path: '',
  component: CloudFoundryComponent
},
{
  path: ':cfId',
  children: [{
    path: 'add-org',
    component: AddOrganizationComponent
  },
  {
    path: 'organizations/:orgId/add-space',
    component: AddSpaceComponent
  },
  {
    path: 'manage-users',
    component: ManageUsersComponent
  },
  {
    path: '',
    // Root for attaching CF wide actions (i.e assignments, tabs)
    component: CloudFoundryBaseComponent,
    children: [
      {
        path: 'organizations/:orgId/edit-org',
        component: EditOrganizationComponent
      },
      {
        path: 'organizations/:orgId/spaces/:spaceId/edit-space',
        component: EditSpaceComponent
      },
      {
        path: '',
        // Root for Tabs
        component: CloudFoundryTabsBaseComponent,
        data: {
          uiFullView: true
        },
        children: [{
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
          component: CloudFoundryOrganizationsComponent,
        },
        {
          path: 'organizations/:orgId',
          component: CloudFoundryOrganizationBaseComponent,
          children: [
            {
              path: '',
              redirectTo: 'summary',
              pathMatch: 'full'
            },
            {
              path: 'summary',
              component: CloudFoundryOrganizationSummaryComponent
            },
            {
              path: 'spaces',
              component: CloudFoundryOrganizationSpacesComponent,
            },
            {
              path: 'users',
              component: CloudFoundryOrganizationUsersComponent
            }]
        },
        {
          path: 'organizations/:orgId/spaces/:spaceId',
          component: CloudFoundrySpaceBaseComponent,
          children: [
            {
              path: '',
              redirectTo: 'summary',
              pathMatch: 'full'
            },
            {
              path: 'summary',
              component: CloudFoundrySpaceSummaryComponent
            },
            {
              path: 'apps',
              component: CloudFoundrySpaceAppsComponent
            },
            {
              path: 'service-instances',
              component: CloudFoundrySpaceServiceInstancesComponent
            },
            {
              path: 'routes',
              component: CloudFoundrySpaceRoutesComponent
            },
            {
              path: 'users',
              component: CloudFoundrySpaceUsersComponent
            }
          ]
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
      }]
  }]
}];

@NgModule({
  imports: [RouterModule.forChild(cloudFoundry)]
})
export class CloudFoundryRoutingModule { }
