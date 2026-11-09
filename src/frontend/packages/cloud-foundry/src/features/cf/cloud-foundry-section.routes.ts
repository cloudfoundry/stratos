import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { cellTitle, cfEndpointTitle, orgQuotaTitle, orgTitle, spaceQuotaTitle, spaceTitle } from '../../route-titles';

import { dynamicExtensionRoutesGuard } from '../../../../core/src/core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../../../core/src/core/extension/extension-service';
import {
  PageNotFoundComponentComponent,
} from '../../../../core/src/core/page-not-found-component/page-not-found-component.component';
import { AddOrganizationComponent } from './add-organization/add-organization.component';
import { AddQuotaComponent } from './add-quota/add-quota.component';
import { AddSpaceQuotaComponent } from './add-space-quota/add-space-quota.component';
import { AddSpaceComponent } from './add-space/add-space.component';
import { CliInfoCloudFoundryComponent } from './cli-info-cloud-foundry/cli-info-cloud-foundry.component';
import { CloudFoundryBaseComponent } from './cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base/cloud-foundry-tabs-base.component';
import { CloudFoundryComponent } from './cloud-foundry/cloud-foundry.component';
import { EditOrganizationComponent } from './edit-organization/edit-organization.component';
import { EditQuotaComponent } from './edit-quota/edit-quota.component';
import { EditSpaceQuotaComponent } from './edit-space-quota/edit-space-quota.component';
import { EditSpaceComponent } from './edit-space/edit-space.component';
import { QuotaDefinitionComponent } from './quota-definition/quota-definition.component';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition/space-quota-definition.component';
import { CloudFoundryBuildPacksComponent } from './tabs/cf-build-packs/cloud-foundry-build-packs.component';
import {
  CloudFoundryCellAppsComponent,
} from './tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell-apps/cloud-foundry-cell-apps.component';
import {
  CloudFoundryCellBaseComponent,
} from './tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell-base/cloud-foundry-cell-base.component';
import {
  CloudFoundryCellChartsComponent,
} from './tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell-charts/cloud-foundry-cell-charts.component';
import {
  CloudFoundryCellSummaryComponent,
} from './tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell-summary/cloud-foundry-cell-summary.component';
import { CloudFoundryCellsSignalComponent } from './tabs/cf-cells/cloud-foundry-cells-signal.component';
import { CloudFoundryEventsComponent } from './tabs/cf-events/cloud-foundry-events.component';
import { CloudFoundryFeatureFlagsComponent } from './tabs/cf-feature-flags/cloud-foundry-feature-flags.component';
import { CloudFoundryFirehoseComponent } from './tabs/cf-firehose/cloud-foundry-firehose.component';
import {
  CloudFoundryOrganizationSpaceQuotasComponent,
} from './tabs/cf-organization-space-quotas/cloud-foundry-organization-space-quotas.component';
import {
  CloudFoundryOrganizationBaseComponent,
} from './tabs/cf-organizations/cf-organization-base/cloud-foundry-organization-base.component';
import {
  CloudFoundryOrganizationEventsComponent,
} from './tabs/cf-organizations/cf-organization-events/cloud-foundry-organization-events.component';
import {
  CloudFoundryOrganizationSpacesSignalComponent,
} from './tabs/cf-organizations/cf-organization-spaces/cloud-foundry-organization-spaces-signal.component';
import {
  CloudFoundrySpaceBaseComponent,
} from './tabs/cf-organizations/cf-organization-spaces/cloud-foundry-space-base/cloud-foundry-space-base.component';
import {
  CloudFoundrySpaceAppsSignalComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-apps/cloud-foundry-space-apps-signal.component';
import {
  CloudFoundrySpaceEventsComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-events/cloud-foundry-space-events.component';
import {
  CloudFoundrySpaceRoutesSignalComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-routes/cloud-foundry-space-routes-signal.component';
import {
  CloudFoundrySpaceServiceInstancesSignalComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-service-instances/cloud-foundry-space-service-instances-signal.component';
import {
  CloudFoundrySpaceSummaryComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-summary/cloud-foundry-space-summary.component';
import {
  CloudFoundrySpaceUserServiceInstancesSignalComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-user-service-instances/cloud-foundry-space-user-service-instances-signal.component';
import {
  CloudFoundrySpaceUsersComponent,
} from './tabs/cf-organizations/cf-organization-spaces/tabs/cloud-foundry-space-users/cloud-foundry-space-users.component';
import {
  CloudFoundryOrganizationSummaryComponent,
} from './tabs/cf-organizations/cf-organization-summary/cloud-foundry-organization-summary.component';
import {
  CloudFoundryOrganizationUsersComponent,
} from './tabs/cf-organizations/cf-organization-users/cloud-foundry-organization-users.component';
import { CloudFoundryOrganizationsSignalComponent } from './tabs/cf-organizations/cloud-foundry-organizations-signal.component';
import { CloudFoundryQuotasComponent } from './tabs/cf-quotas/cloud-foundry-quotas.component';
import {
  CloudFoundryApplicationsSignalComponent,
} from './tabs/cf-applications/cloud-foundry-applications-signal.component';
import {
  CloudFoundryMarketplaceSignalComponent,
} from './tabs/cf-marketplace/cloud-foundry-marketplace-signal.component';
import { CloudFoundryRoutesSignalComponent } from './tabs/cf-routes/cloud-foundry-routes-signal.component';
import {
  CloudFoundryServicesSignalComponent,
} from './tabs/cf-services/cloud-foundry-services-signal.component';
import { CloudFoundrySecurityGroupsComponent } from './tabs/cf-security-groups/cloud-foundry-security-groups.component';
import { CloudFoundryStacksComponent } from './tabs/cf-stacks/cloud-foundry-stacks.component';
import { CloudFoundrySummaryTabComponent } from './tabs/cf-summary-tab/cloud-foundry-summary-tab.component';
import { CloudFoundryUsersComponent } from './tabs/cf-users/cloud-foundry-users.component';
import { InviteUsersComponent } from './users/invite-users/invite-users.component';
import { UsersRolesComponent } from './users/manage-users/manage-users.component';

const usersRoles: Routes = [
  {
    path: 'users/manage',
    title: tabTitle('Manage Users'),
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/users/manage',
    title: tabTitle('Manage Users'),
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/users/invite',
    title: tabTitle('Invite Users'),
    component: InviteUsersComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/spaces/:spaceId/users/manage',
    title: tabTitle('Manage Users'),
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/spaces/:spaceId/users/invite',
    title: tabTitle('Invite Users'),
    component: InviteUsersComponent,
    pathMatch: 'full'
  },
];

export const CLOUD_FOUNDRY_SECTION_ROUTES: Routes = [{
  path: '',
  component: CloudFoundryComponent
},
{
  path: ':endpointId',
  title: cfEndpointTitle,
  children: [
    {
      path: 'add-org',
      title: tabTitle('Create Organization'),
      component: AddOrganizationComponent
    },
    {
      path: 'organizations/:orgId/add-space',
      title: tabTitle('Create Space'),
      component: AddSpaceComponent
    },
    {
      path: 'add-quota',
      title: tabTitle('Create Quota'),
      component: AddQuotaComponent
    },
    {
      path: 'organizations/:orgId/add-space-quota',
      title: tabTitle('Create Space Quota'),
      component: AddSpaceQuotaComponent
    },
    ...usersRoles,
    {
      path: '',
      // Root for attaching CF wide actions (i.e assignments, tabs)
      component: CloudFoundryBaseComponent,
      children: [
        // Quota detail and edit routes moved to CloudFoundryTabsBaseComponent children
        // to get the CF side navigation. See the tabs block below.
        {
          path: 'organizations/:orgId/edit-org',
          title: tabTitle('Edit Organization'),
          component: EditOrganizationComponent
        },
        {
          path: 'organizations/:orgId/spaces/:spaceId/edit-space',
          title: tabTitle('Edit Space'),
          component: EditSpaceComponent
        },
        {
          path: 'cli',
          title: tabTitle('CF CLI All'),
          component: CliInfoCloudFoundryComponent,
        },
        {
          path: 'organizations/:orgId/cli',
          title: tabTitle('CF CLI All'),
          component: CliInfoCloudFoundryComponent,
          pathMatch: 'full'
        },
        {
          path: 'organizations/:orgId/spaces/:spaceId/cli',
          title: tabTitle('CF CLI All'),
          component: CliInfoCloudFoundryComponent,
          pathMatch: 'full'
        },
        {
          path: '',
          data: {
            extensionsActionsKey: StratosActionType.Application
          },
          component: CloudFoundryTabsBaseComponent,
          children: [
            {
              path: '',
              redirectTo: 'summary',
              pathMatch: 'full',
            },
            {
              path: 'summary',
              title: tabTitle('Summary'),
              component: CloudFoundrySummaryTabComponent
            },
            {
              path: 'organizations',
              title: tabTitle('Organizations'),
              component: CloudFoundryOrganizationsSignalComponent,
            },
            {
              path: 'applications',
              title: tabTitle('Applications'),
              component: CloudFoundryApplicationsSignalComponent,
            },
            {
              path: 'marketplace',
              title: tabTitle('Marketplace'),
              component: CloudFoundryMarketplaceSignalComponent,
            },
            {
              path: 'services',
              title: tabTitle('Services'),
              component: CloudFoundryServicesSignalComponent,
            },
            {
              path: 'users',
              title: tabTitle('Users'),
              component: CloudFoundryUsersComponent
            },
            {
              path: 'cells',
              title: tabTitle('Cells'),
              component: CloudFoundryCellsSignalComponent
            },
            {
              path: 'firehose',
              title: tabTitle('Firehose'),
              component: CloudFoundryFirehoseComponent
            },
            {
              path: 'feature-flags',
              title: tabTitle('Feature Flags'),
              component: CloudFoundryFeatureFlagsComponent
            },
            {
              path: 'build-packs',
              title: tabTitle('Build Packs'),
              component: CloudFoundryBuildPacksComponent
            },
            {
              path: 'stacks',
              title: tabTitle('Stacks'),
              component: CloudFoundryStacksComponent
            },
            {
              path: 'security-groups',
              title: tabTitle('Security Groups'),
              component: CloudFoundrySecurityGroupsComponent
            },
            {
              path: 'routes',
              title: tabTitle('Routes'),
              component: CloudFoundryRoutesSignalComponent
            },
            {
              path: 'quota-definitions',
              title: tabTitle('Organization Quotas'),
              component: CloudFoundryQuotasComponent
            },
            {
              path: 'quota-definitions/:quotaId',
              title: orgQuotaTitle,
              component: QuotaDefinitionComponent
            },
            {
              path: 'quota-definitions/:quotaId/edit-quota',
              title: tabTitle('Edit Quota'),
              component: EditQuotaComponent
            },
            {
              path: 'organizations/:orgId/space-quota-definitions/:quotaId',
              title: spaceQuotaTitle,
              component: SpaceQuotaDefinitionComponent
            },
            {
              path: 'organizations/:orgId/space-quota-definitions/:quotaId/edit-space-quota',
              title: tabTitle('Edit Space Quota'),
              component: EditSpaceQuotaComponent
            },
            {
              path: 'events',
              title: tabTitle('Events'),
              component: CloudFoundryEventsComponent
            },
            {
              path: '**',
              component: PageNotFoundComponentComponent,
              canActivate: [dynamicExtensionRoutesGuard],
              data: {
                stratosRouteGroup: 'cfTabs'
              }
            }
          ]
        },
        {
          path: '',
          // Root for Tabs
          children: [
            {
              path: 'cells/:cellId',
              title: cellTitle,
              component: CloudFoundryCellBaseComponent,
              children: [
                {
                  path: '',
                  redirectTo: 'summary',
                  pathMatch: 'full'
                },
                {
                  path: 'summary',
                  title: tabTitle('Summary'),
                  component: CloudFoundryCellSummaryComponent
                },
                {
                  path: 'charts',
                  title: tabTitle('Metrics'),
                  component: CloudFoundryCellChartsComponent
                },
                {
                  path: 'apps',
                  title: tabTitle('App Instances'),
                  component: CloudFoundryCellAppsComponent
                }
              ]
            },
            {
              path: 'organizations/:orgId',
              title: orgTitle,
              component: CloudFoundryOrganizationBaseComponent,
              data: {
                extensionsActionsKey: StratosActionType.CloudFoundryOrg
              },
              children: [
                {
                  path: '',
                  redirectTo: 'summary',
                  pathMatch: 'full'
                },
                {
                  path: 'summary',
                  title: tabTitle('Summary'),
                  component: CloudFoundryOrganizationSummaryComponent
                },
                {
                  path: 'spaces',
                  title: tabTitle('Spaces'),
                  component: CloudFoundryOrganizationSpacesSignalComponent,
                },
                {
                  path: 'users',
                  title: tabTitle('Users'),
                  component: CloudFoundryOrganizationUsersComponent
                },
                {
                  path: 'quota',
                  title: tabTitle('Quota'),
                  component: QuotaDefinitionComponent
                },
                {
                  path: 'space-quota-definitions',
                  title: tabTitle('Space Quotas'),
                  component: CloudFoundryOrganizationSpaceQuotasComponent
                },
                {
                  path: 'events',
                  title: tabTitle('Events'),
                  component: CloudFoundryOrganizationEventsComponent
                },
                {
                  path: '**',
                  component: PageNotFoundComponentComponent,
                  canActivate: [dynamicExtensionRoutesGuard],
                  data: {
                    stratosRouteGroup: 'cfOrgTabs'
                  }
                }
              ]
            },
            {
              path: 'organizations/:orgId/spaces/:spaceId',
              title: spaceTitle,
              data: {
                extensionsActionsKey: StratosActionType.CloudFoundrySpace
              },
              component: CloudFoundrySpaceBaseComponent,
              children: [
                {
                  path: '',
                  redirectTo: 'summary',
                  pathMatch: 'full'
                },
                {
                  path: 'summary',
                  title: tabTitle('Summary'),
                  component: CloudFoundrySpaceSummaryComponent
                },
                {
                  path: 'apps',
                  title: tabTitle('Applications'),
                  component: CloudFoundrySpaceAppsSignalComponent
                },
                {
                  path: 'service-instances',
                  title: tabTitle('Services'),
                  component: CloudFoundrySpaceServiceInstancesSignalComponent
                },
                {
                  path: 'user-service-instances',
                  title: tabTitle('User Services'),
                  component: CloudFoundrySpaceUserServiceInstancesSignalComponent
                },
                {
                  path: 'routes',
                  title: tabTitle('Routes'),
                  component: CloudFoundrySpaceRoutesSignalComponent
                },
                {
                  path: 'users',
                  title: tabTitle('Users'),
                  component: CloudFoundrySpaceUsersComponent
                },
                {
                  path: 'quota',
                  title: tabTitle('Quota'),
                  component: QuotaDefinitionComponent
                },
                {
                  path: 'space-quota',
                  title: tabTitle('Space Quota'),
                  component: SpaceQuotaDefinitionComponent
                },
                {
                  path: 'events',
                  title: tabTitle('Events'),
                  component: CloudFoundrySpaceEventsComponent
                },
                {
                  path: '**',
                  component: PageNotFoundComponentComponent,
                  canActivate: [dynamicExtensionRoutesGuard],
                  data: {
                    stratosRouteGroup: 'cfSpaceTabs'
                  }
                }
              ]
            },
          ]
        }]
    },
    {
      path: '**',
      component: PageNotFoundComponentComponent,
      canActivate: [dynamicExtensionRoutesGuard],
      data: {
        stratosRouteGroup: StratosActionType.CloudFoundry
      }
    }
  ]
}];
