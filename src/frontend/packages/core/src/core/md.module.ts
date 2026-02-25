import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomProgressBarComponent } from '../shared/components/custom-material/custom-material.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    ScrollingModule,
    FormsModule,
    ReactiveFormsModule,
    CustomProgressBarComponent,
  ],
  exports: [
    CommonModule,
    ScrollingModule,
    FormsModule,
    ReactiveFormsModule,
    CustomProgressBarComponent,
  ]
})
export class MDAppModule { }