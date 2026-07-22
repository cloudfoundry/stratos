import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { IPageSideNavTab } from '../../dashboard/page-side-nav/page-side-nav.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-diagnostics-base',
  template: `
    <app-page-header [breadcrumbs]="breadcrumbs" [tabs]="tabLinks" tabsHeader="Diagnostics">
      <h1>Diagnostics</h1>
    </app-page-header>
    <router-outlet></router-outlet>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, RouterOutlet],
})
export class DiagnosticsBaseComponent {
  breadcrumbs = [{ breadcrumbs: [{ value: 'About', routerLink: '/about' }] }];

  tabLinks: IPageSideNavTab[] = [
    { link: 'overview', label: 'Overview', icon: 'build' },
    { link: 'counts', label: 'Entity Counts', icon: 'storage' },
    { link: 'performance', label: 'Load Performance', icon: 'speed' },
    { link: 'probes', label: 'Endpoint Probes', icon: 'network_check' },
  ];
}
