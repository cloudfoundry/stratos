import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApiKeysPageComponent } from './api-keys-page/api-keys-page.component';

const apiKeys: Routes = [
  {
    path: '',
    component: ApiKeysPageComponent
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(apiKeys),
  ]
})
export class ApiKeysRoutingModule { }
