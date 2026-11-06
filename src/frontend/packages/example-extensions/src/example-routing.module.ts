import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const customRoutes: Routes = [{
  path: 'example',
  loadChildren: () => import('./nav-extension/nav-extension.module').then(m => m.NavExtensionModule),
  data: {
    stratosNavigation: {
      text: 'Example',
      matIcon: 'extension'
    }
  }
}];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class ExampleRoutingModule { }
