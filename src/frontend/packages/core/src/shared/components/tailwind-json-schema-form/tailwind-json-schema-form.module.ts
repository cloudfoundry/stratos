import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TailwindJsonSchemaFormComponent } from './tailwind-json-schema-form.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TailwindJsonSchemaFormComponent
  ],
  exports: [
    TailwindJsonSchemaFormComponent
  ]
})
export class TailwindJsonSchemaFormModule { }