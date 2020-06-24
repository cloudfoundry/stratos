import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ExampleComponent } from './example-component/example.component';
import { NavExtensionRoutingModule } from './nav-extension.routing';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    NavExtensionRoutingModule,
  ],
  declarations: [
    ExampleComponent
  ]
})
export class NavExtensionModule {}
