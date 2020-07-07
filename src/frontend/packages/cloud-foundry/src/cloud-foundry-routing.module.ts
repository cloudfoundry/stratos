import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const customRoutes: Routes = [
  {
    path: 'applications',
    loadChildren: () => import('./features/applications/applications.module').then(m => m.ApplicationsModule),
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
    loadChildren: () => import('./features/service-catalog/service-catalog.module')
      .then(m => m.ServiceCatalogModule),
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
    loadChildren: () => import('./features/services/services.module').then(m => m.ServicesModule),
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
    loadChildren: () => import('./features/cloud-foundry/cloud-foundry-section.module').then(m => m.CloudFoundrySectionModule),
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
]

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CloudFoundryRoutingModule { }