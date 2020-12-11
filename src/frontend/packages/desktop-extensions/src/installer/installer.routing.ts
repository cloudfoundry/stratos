import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
    RouterModule.forChild(settingsRoutes)
  ],
  declarations: [
    ChooseTypeComponent
  ],
})
export class InstallerRoutingModule {
}
