import { NgModule } from '@angular/core';
import { NavExtensionRoutingModule } from './nav-extension.routing';
import { ExampleComponent } from './example-component/example.component';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    NavExtensionRoutingModule,
  ],
  declarations: [
    ExampleComponent
  ],
  entryComponents: [
    ExampleComponent
  ]
})
export class NavExtensionModule {}
