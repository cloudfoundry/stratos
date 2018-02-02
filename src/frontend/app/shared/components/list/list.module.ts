import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ListComponent
  ],
  exports: [
    ListComponent
  ]
})
export class ListModule { }
