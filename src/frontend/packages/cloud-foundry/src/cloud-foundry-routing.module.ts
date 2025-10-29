import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const customRoutes: Routes = [
  {
    path: 'applications',
    loadChildren: () => import('./features/applications/applications.routes').then(m => m.APPLICATIONS_ROUTES),
    data: {
      stratosNavigation: {
        label: 'Applications',
        matIcon: 'apps',
        requiresEndpointType: 'cf',
        position: 20
      }
    },
  },
  {
    path: 'marketplace',
    loadChildren: () => import('./features/service-catalog/service-catalog.routes')
      .then(m => m.SERVICE_CATALOG_ROUTES),
    data: {
      stratosNavigation: {
        label: 'Marketplace',
        matIcon: 'store',
        requiresEndpointType: 'cf',
        position: 30
      }
    },
  },
  {
    path: 'services',
    loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICES_ROUTES),
    data: {
      stratosNavigation: {
        label: 'Services',
        matIcon: 'service',
        matIconFont: 'stratos-icons',
        requiresEndpointType: 'cf',
        position: 40
      }
    },
  },
  {
    path: 'cloud-foundry',
    loadChildren: () => import('./features/cf/cloud-foundry-section.routes').then(m => m.CLOUD_FOUNDRY_SECTION_ROUTES),
    data: {
      stratosNavigation: {
        label: 'Cloud Foundry',
        matIcon: 'cloud_foundry',
        matIconFont: 'stratos-icons',
        requiresEndpointType: 'cf',
        position: 50
      }
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CloudFoundryRoutingModule { }
