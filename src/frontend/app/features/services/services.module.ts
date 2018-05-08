import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesWallComponent } from './services-wall/services-wall.component';
import { ServicesRoutingModule } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    ServicesRoutingModule
  ],
  declarations: [ServicesWallComponent]
})
export class ServicesModule { }
