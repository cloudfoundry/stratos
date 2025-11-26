import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { CoreModule, SharedModule } from '@stratosui/core';

import { ChooseTypeComponent } from './choose-type/choose-type.component';


const settingsRoutes: Routes = [
  {
    path: '',
    component: ChooseTypeComponent,
  },
];

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    RouterModule.forChild(settingsRoutes),
    // Standalone components
    ChooseTypeComponent
  ]
})
export class InstallerRoutingModule {
}
