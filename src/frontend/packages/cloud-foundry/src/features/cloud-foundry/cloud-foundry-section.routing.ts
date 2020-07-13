import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DynamicExtensionRoutes } from '../../../../core/src/core/extension/dynamic-extension-routes';
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
import { CloudFoundryCellsComponent } from './tabs/cloud-foundry-cells/cloud-foundry-cells.component';
import { CloudFoundryEventsComponent } from './tabs/cloud-foundry-events/cloud-foundry-events.component';
import { CloudFoundryFeatureFlagsComponent } from './tabs/cloud-foundry-feature-flags/cloud-foundry-feature-flags.component';
import { CloudFoundryFirehoseComponent } from './tabs/cloud-foundry-firehose/cloud-foundry-firehose.component';
import {
  CloudFoundryOrganizationSpaceQuotasComponent,
} from './tabs/cloud-foundry-organization-space-quotas/cloud-foundry-organization-space-quotas.component';
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
import { InviteUsersComponent } from './users/invite-users/invite-users.component';
import { UsersRolesComponent } from './users/manage-users/manage-users.component';
import { RemoveUserComponent } from './users/remove-user/remove-user.component';

/* tslint:disable:max-line-length */


/* tslint:enable:max-line-length */

const usersRoles = [
  {
    path: 'users/manage',
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'users/remove',
    component: RemoveUserComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/users/manage',
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/users/remove',
    component: RemoveUserComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/users/invite',
    component: InviteUsersComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/spaces/:spaceId/users/manage',
    component: UsersRolesComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/spaces/:spaceId/users/remove',
    component: RemoveUserComponent,
    pathMatch: 'full'
  },
  {
    path: 'organizations/:orgId/spaces/:spaceId/users/invite',
    component: InviteUsersComponent,
    pathMatch: 'full'
  },
];

const cloudFoundry: Routes = [{
  path: '',
  component: CloudFoundryComponent
},
{
  path: ':endpointId',
  children: [
    {
      path: 'add-org',
      component: AddOrganizationComponent
    },
    {
      path: 'organizations/:orgId/add-space',
      component: AddSpaceComponent
    },
    {
      path: 'add-quota',
      component: AddQuotaComponent
    },
    {
      path: 'organizations/:orgId/add-space-quota',
      component: AddSpaceQuotaComponent
    },
    ...usersRoles,
    {
      path: '',
      // Root for attaching CF wide actions (i.e assignments, tabs)
      component: CloudFoundryBaseComponent,
      children: [
        {
          path: 'quota-definitions/:quotaId',
          component: QuotaDefinitionComponent
        },
        {
          path: 'quota-definitions/:quotaId/edit-quota',
          component: EditQuotaComponent
        },
        {
          path: 'organizations/:orgId/space-quota-definitions/:quotaId/edit-space-quota',
          component: EditSpaceQuotaComponent
        },
        {
          path: 'organizations/:orgId/space-quota-definitions/:quotaId',
          component: SpaceQuotaDefinitionComponent
        },
        {
          path: 'organizations/:orgId/edit-org',
          component: EditOrganizationComponent
        },
        {
          path: 'organizations/:orgId/spaces/:spaceId/edit-space',
          component: EditSpaceComponent
        },
        {
          path: 'cli',
          component: CliInfoCloudFoundryComponent,
        },
        {
          path: 'organizations/:orgId/cli',
          component: CliInfoCloudFoundryComponent,
          pathMatch: 'full'
        },
        {
          path: 'organizations/:orgId/spaces/:spaceId/cli',
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
              component: CloudFoundrySummaryTabComponent
            },
            {
              path: 'organizations',
              component: CloudFoundryOrganizationsComponent,
            },
            {
              path: 'users',
              component: CloudFoundryUsersComponent
            },
            {
              path: 'cells',
              component: CloudFoundryCellsComponent
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
            },
            {
              path: 'routes',
              component: CloudFoundryRoutesComponent
            },
            {
              path: 'quota-definitions',
              component: CloudFoundryQuotasComponent
            },
            {
              path: 'events',
              component: CloudFoundryEventsComponent
            },
            {
              path: '**',
              component: PageNotFoundComponentComponent,
              canActivate: [DynamicExtensionRoutes],
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
              component: CloudFoundryCellBaseComponent,
              children: [
                {
                  path: '',
                  redirectTo: 'summary',
                  pathMatch: 'full'
                },
                {
                  path: 'summary',
                  component: CloudFoundryCellSummaryComponent
                },
                {
                  path: 'charts',
                  component: CloudFoundryCellChartsComponent
                },
                {
                  path: 'apps',
                  component: CloudFoundryCellAppsComponent
                }
              ]
            },
            {
              path: 'organizations/:orgId',
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
                  component: CloudFoundryOrganizationSummaryComponent
                },
                {
                  path: 'spaces',
                  component: CloudFoundryOrganizationSpacesComponent,
                },
                {
                  path: 'users',
                  component: CloudFoundryOrganizationUsersComponent
                },
                {
                  path: 'quota',
                  component: QuotaDefinitionComponent
                },
                {
                  path: 'space-quota-definitions',
                  component: CloudFoundryOrganizationSpaceQuotasComponent
                },
                {
                  path: 'events',
                  component: CloudFoundryOrganizationEventsComponent
                },
                {
                  path: '**',
                  component: PageNotFoundComponentComponent,
                  canActivate: [DynamicExtensionRoutes],
                  data: {
                    stratosRouteGroup: 'cfOrgTabs'
                  }
                }
              ]
            },
            {
              path: 'organizations/:orgId/spaces/:spaceId',
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
                  path: 'user-service-instances',
                  component: CloudFoundrySpaceUserServiceInstancesComponent
                },
                {
                  path: 'routes',
                  component: CloudFoundrySpaceRoutesComponent
                },
                {
                  path: 'users',
                  component: CloudFoundrySpaceUsersComponent
                },
                {
                  path: 'quota',
                  component: QuotaDefinitionComponent
                },
                {
                  path: 'space-quota',
                  component: SpaceQuotaDefinitionComponent
                },
                {
                  path: 'events',
                  component: CloudFoundrySpaceEventsComponent
                },
                {
                  path: '**',
                  component: PageNotFoundComponentComponent,
                  canActivate: [DynamicExtensionRoutes],
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
      canActivate: [DynamicExtensionRoutes],
      data: {
        stratosRouteGroup: StratosActionType.CloudFoundry
      }
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(cloudFoundry)]
})
export class CloudFoundrySectionRoutingModule { }
