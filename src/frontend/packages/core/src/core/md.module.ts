import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomProgressBarComponent } from '../shared/components/custom-material/custom-material.component';
import { CustomCheckboxComponent } from '../shared/components/custom-checkbox/custom-checkbox.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputDirective } from '../shared/components/custom-form-field/custom-form-field.component';
import { DisableRouterLinkDirective } from './disable-router-link.directive';

@NgModule({
  imports: [
    CommonModule,
    ScrollingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    CustomProgressBarComponent,
    CustomCheckboxComponent,
    MatInputDirective,
    DisableRouterLinkDirective
  ],
  exports: [
    CommonModule,
    ScrollingModule,
    FormsModule,
    ReactiveFormsModule,
    CustomProgressBarComponent,
    CustomCheckboxComponent,
    MatInputDirective,
    DisableRouterLinkDirective
  ]
})
export class MDAppModule { }