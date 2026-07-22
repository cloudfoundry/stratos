import { Routes } from '@angular/router';

import { AboutPageComponent } from './about-page/about-page.component';
import { DiagnosticCountsPageComponent } from './diagnostic-counts-page/diagnostic-counts-page.component';
import { DiagnosticPerformancePageComponent } from './diagnostic-performance-page/diagnostic-performance-page.component';
import { DiagnosticProbesPageComponent } from './diagnostic-probes-page/diagnostic-probes-page.component';
import { DiagnosticsBaseComponent } from './diagnostics-base/diagnostics-base.component';
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
    component: DiagnosticsBaseComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: DiagnosticsPageComponent },
      { path: 'counts', component: DiagnosticCountsPageComponent },
      { path: 'performance', component: DiagnosticPerformancePageComponent },
      { path: 'probes', component: DiagnosticProbesPageComponent },
    ]
  }
];
