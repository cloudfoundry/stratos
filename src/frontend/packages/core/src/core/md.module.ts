import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    CommonModule,
    ScrollingModule
  ],
  exports: [
    CommonModule,
    ScrollingModule
  ]
})
export class MDAppModule { }