import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent } from './error-page/error-page.component';

const errorPage: Routes = [{
  path: '',
  component: ErrorPageComponent
}];

@NgModule({
  imports: [RouterModule.forChild(errorPage)]
})
export class ErrorPageRoutingModule { }
