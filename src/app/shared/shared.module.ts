import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { SteppersModule } from './components/stepper/steppers.module';


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
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderModule,
    SteppersModule
  ]
})
export class SharedModule { }
