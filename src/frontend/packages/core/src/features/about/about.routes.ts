import type { Routes } from '@angular/router';

import { AboutPageComponent } from './about-page/about-page.component';
import { DiagnosticsPageComponent } from './diagnostics-page/diagnostics-page.component';
import { EulaPageComponent } from './eula-page/eula-page.component';

export const ABOUT_ROUTES: Routes = [
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
