import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { appTitle } from '../../route-titles';

import { dynamicExtensionRoutesGuard } from '../../../../core/src/core/extension/dynamic-extension-routes';
import { StratosActionType, StratosTabType } from '../../../../core/src/core/extension/extension-service';
import {
  PageNotFoundComponentComponent,
} from '../../../../core/src/core/page-not-found-component/page-not-found-component.component';
import {
  AddServiceInstanceBaseStepComponent,
} from '../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { ApplicationDeleteComponent } from './application-delete/application-delete.component';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { GitSCMTabComponent } from './application/application-tabs-base/tabs/gitscm-tab/gitscm-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { MetricsTabComponent } from './application/application-tabs-base/tabs/metrics-tab/metrics-tab.component';
import {
  RevisionDetailComponent,
} from './application/application-tabs-base/tabs/revisions-tab/revision-detail/revision-detail.component';
import {
  RevisionsCompareComponent,
} from './application/application-tabs-base/tabs/revisions-tab/revisions-compare/revisions-compare.component';
import {
  RevisionsTabComponent,
} from './application/application-tabs-base/tabs/revisions-tab/revisions-tab.component';
import { RoutesTabComponent } from './application/application-tabs-base/tabs/routes-tab/routes-tab/routes-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { CliInfoApplicationComponent } from './cli-info-application/cli-info-application.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { DeployApplicationComponent } from './deploy-application/deploy-application.component';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { NewApplicationBaseStepComponent } from './new-application-base-step/new-application-base-step.component';
import { AddRouteStepperComponent } from './routes/add-route-stepper/add-route-stepper.component';
import { SshApplicationComponent } from './ssh-application/ssh-application.component';

export const APPLICATIONS_ROUTES: Routes = [
  {
    path: 'new',
    title: 'New Application',
    component: NewApplicationBaseStepComponent,
    pathMatch: 'full'
  },
  {
    path: 'new/:endpointId',
    title: 'New Application',
    component: NewApplicationBaseStepComponent,
    pathMatch: 'full'
  },
  {
    path: 'create',
    title: 'Create Application',
    component: CreateApplicationComponent,
  },
  {
    path: 'deploy',
    title: 'Deploy Application',
    component: DeployApplicationComponent
  },
  {
    path: '',
    children: [
      {
        path: '',
        component: ApplicationWallComponent,
        pathMatch: 'full',
        data: {
          extensionsActionsKey: StratosActionType.Applications
        }
      },
      {
        path: ':endpointId',
        component: ApplicationWallComponent,
        pathMatch: 'full'
      },
      {
        path: ':endpointId/:id',
        title: appTitle,
        component: ApplicationBaseComponent,
        // Keep the app-detail shell alive while the user switches side tabs
        // (Summary/Logs/Variables/...). Without this the CustomReuseStrategy
        // tears down ApplicationBaseComponent on every tab click, re-running
        // its eager data load — including the env-vars fetch that emits an
        // audit.app.environment.show event each time. The strategy only
        // reuses when the route params (:endpointId/:id) also match, so
        // navigating to a different app still rebuilds. (#5519)
        data: {
          reuseRoute: ApplicationBaseComponent
        },
        children: [
          {
            path: 'delete',
            title: tabTitle('Delete application'),
            component: ApplicationDeleteComponent
          },
          {
            path: 'edit',
            title: tabTitle('Edit Application'),
            component: EditApplicationComponent,
          },
          {
            path: 'ssh/:index',
            title: tabTitle(route => `SSH (#${route.paramMap.get('index')})`),
            component: SshApplicationComponent,
          },
          {
            path: 'cli',
            title: tabTitle('CF CLI All'),
            component: CliInfoApplicationComponent,
          },
          {
            path: 'bind',
            title: tabTitle('Choose Service Type'),
            component: AddServiceInstanceBaseStepComponent,
            data: {
              bind: true
            }
          },
          {
            path: 'bind/:type',
            component: AddServiceInstanceComponent,
          },
          {
            path: '',
            component: ApplicationTabsBaseComponent,
            data: {
              extensionsActionsKey: StratosActionType.Application,
              // Persist the tabs shell across tab switches too (see the
              // parent route's reuseRoute note). Its path is empty so its
              // params never change; it rebuilds only when the parent does
              // (i.e. on navigation to a different app). (#5519)
              reuseRoute: ApplicationTabsBaseComponent
            },
            children: [
              // Function-form redirect so the ?breadcrumbs= query param
              // (set by row links on scoped apps walls) survives the
              // empty-path → summary hop. Default `redirectTo: 'summary'`
              // strips query params, which broke the "back to CF-scoped
              // applications" breadcrumb. RedirectFunction must return
              // `string | UrlTree`, so we append the query string to the
              // path manually.
              {
                path: '',
                redirectTo: ({ queryParams }) => {
                  const qs = Object.entries(queryParams)
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                    .join('&');
                  return qs ? `summary?${qs}` : 'summary';
                },
                pathMatch: 'full',
              },
              { path: 'summary', title: tabTitle('Summary'), component: BuildTabComponent },
              // Instances content now lives in an accordion on the Summary tab;
              // redirect legacy deep links/bookmarks so they don't 404.
              { path: 'instances', redirectTo: 'summary', pathMatch: 'full' },
              { path: 'routes', title: tabTitle('Routes'), component: RoutesTabComponent },
              { path: 'log-stream', title: tabTitle('Log Stream'), component: LogStreamTabComponent },
              { path: 'services', title: tabTitle('Services'), component: ServicesTabComponent },
              { path: 'variables', title: tabTitle('Variables'), component: VariablesTabComponent },
              { path: 'events', title: tabTitle('Events'), component: EventsTabComponent },
              { path: 'gitscm', title: tabTitle('Git'), component: GitSCMTabComponent },
              { path: 'metrics', title: tabTitle('Metrics'), component: MetricsTabComponent },
              { path: 'revisions', title: tabTitle('Revisions'), component: RevisionsTabComponent },
              { path: 'revisions/compare', title: tabTitle('Compare Revisions'), component: RevisionsCompareComponent },
              { path: 'revisions/:revisionGuid', title: tabTitle('Revision'), component: RevisionDetailComponent },
              {
                path: '**',
                component: PageNotFoundComponentComponent,
                canActivate: [dynamicExtensionRoutesGuard],
                data: {
                  stratosRouteGroup: StratosTabType.Application
                }
              }
            ]
          },
          {
            path: 'add-route',
            title: tabTitle('Create Route'),
            component: AddRouteStepperComponent,
          },
          {
            path: '**',
            component: PageNotFoundComponentComponent,
            canActivate: [dynamicExtensionRoutesGuard],
            data: {
              stratosRouteGroup: StratosActionType.Application
            }
          }
        ]
      }
    ]
  },
  {
    path: '**',
    component: PageNotFoundComponentComponent,
    canActivate: [dynamicExtensionRoutesGuard],
    data: {
      stratosRouteGroup: StratosActionType.Applications
    }
  }
];
