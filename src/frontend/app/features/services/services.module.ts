import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ServicesWallComponent } from './services-wall/services-wall.component';
import { ServicesRoutingModule } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    ServicesRoutingModule
  ],
  declarations: [ServicesWallComponent]
})
export class ServicesModule { }
