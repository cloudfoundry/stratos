import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutPageComponent } from './about-page/about-page.component';
import { EulaPageComponent } from './eula-page/eula-page.component';
import { DiagnosticsPageComponent } from './diagnostics-page/diagnostics-page.component';

const about: Routes = [
  {
    path: '',
    component: AboutPageComponent
  },
  {
    path: 'eula',
    component: EulaPageComponent
  },
  {
    path: 'diagnostics',
    component: DiagnosticsPageComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(about),
  ]
})
export class AboutRoutingModule { }
