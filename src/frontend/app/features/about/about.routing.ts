import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AboutPageComponent } from './about-page/about-page.component';

const about: Routes = [
  {
    path: '',
    component: AboutPageComponent,
  }];

@NgModule({
  imports: [
    RouterModule.forChild(about),
  ]
})
export class AboutRoutingModule { }
