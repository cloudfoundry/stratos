import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { ApiDrivenViewsRoutingModule } from './api-driven-views-routing.module';
import { ApiEntityListComponent } from './components/api-entity-list/api-entity-list.component';
import { ApiEntityTypeSelectorComponent } from './components/api-type-selector/api-entity-type-selector.component';
import { ApiEndpointSelectPageComponent } from './features/api-endpoint-select-page/api-endpoint-select-page.component';
import {
  ApiEndpointTypeSelectPageComponent,
} from './features/api-endpoint-type-select-page/api-endpoint-type-select-page.component';
import { ApiEntityListPageComponent } from './features/api-entity-list-page/api-entity-list-page.component';
import {
  ApiEntityTypeSelectPageComponent,
} from './features/api-entity-type-select-page/api-entity-type-select-page.component';

@NgModule({
  declarations: [
    ApiEndpointSelectPageComponent,
    ApiEndpointTypeSelectPageComponent,
    ApiEntityTypeSelectPageComponent,
    ApiEntityListPageComponent,
    ApiEntityListComponent,
    ApiEntityTypeSelectorComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ApiDrivenViewsRoutingModule
  ]
})
export class ApiDrivenViewsModule { }
