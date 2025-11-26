import { NgModule } from '@angular/core';
import { CoreModule, SharedModule } from '@stratosui/core';

import { ExampleComponent } from './example-component/example.component';
import { NavExtensionRoutingModule } from './nav-extension.routing';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    NavExtensionRoutingModule,
    // Standalone components
    ExampleComponent
  ]
})
export class NavExtensionModule {}
