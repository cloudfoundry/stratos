import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { SteppersModule } from './components/stepper/steppers.module';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule
  ],
  declarations: [
    LoadingPageComponent,
    StatefulIconComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderModule,
    SteppersModule,
    StatefulIconComponent
  ]
})
export class SharedModule { }
