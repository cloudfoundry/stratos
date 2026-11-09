import { Routes } from '@angular/router';

import { dynamicExtensionRoutesGuard } from '../../core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../core/extension/extension-service';
import { PageNotFoundComponentComponent } from '../../core/page-not-found-component/page-not-found-component.component';
import { BackupEndpointsComponent } from './backup-restore/backup-endpoints/backup-endpoints.component';
import {
  BackupRestoreEndpointsComponent,
} from './backup-restore/backup-restore-endpoints/backup-restore-endpoints.component';
import { RestoreEndpointsComponent } from './backup-restore/restore-endpoints/restore-endpoints.component';
import {
  CreateEndpointBaseStepComponent,
} from './create-endpoint/create-endpoint-base-step/create-endpoint-base-step.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { EditEndpointComponent } from './edit-endpoint/edit-endpoint.component';
import { canEditEndpointGuard } from './endpoint-permissions.service';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';

export const ENDPOINTS_ROUTES: Routes = [
  {
    path: '', component: EndpointsPageComponent,
    data: {
      extensionsActionsKey: StratosActionType.Endpoints
    }
  },
  {
    path: 'new',
    title: 'Register Endpoint',
    component: CreateEndpointBaseStepComponent
  },
  {
    path: 'new/:type/:subtype',
    title: 'Register Endpoint',
    component: CreateEndpointComponent
  },
  {
    path: 'new/:type',
    title: 'Register Endpoint',
    component: CreateEndpointComponent
  },
  {
    path: 'edit/:id',
    title: 'Edit Endpoint',
    component: EditEndpointComponent,
    canActivate: [canEditEndpointGuard]
  },
  {
    path: 'backup-restore',
    title: 'Backup/Restore Endpoints',
    component: BackupRestoreEndpointsComponent
  },
  {
    path: 'backup-restore/backup',
    title: 'Backup Endpoints',
    component: BackupEndpointsComponent
  },
  {
    path: 'backup-restore/restore',
    title: 'Restore Endpoints',
    component: RestoreEndpointsComponent
  },
  {
    path: '**',
    component: PageNotFoundComponentComponent,
    canActivate: [dynamicExtensionRoutesGuard],
    data: {
      stratosRouteGroup: StratosActionType.Endpoints
    }
  }
];
