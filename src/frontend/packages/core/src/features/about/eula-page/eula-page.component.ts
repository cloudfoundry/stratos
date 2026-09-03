import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-eula-page',
  templateUrl: './eula-page.component.html',
  standalone: true,
  imports: [
    CustomIconComponent,
    CustomTooltipDirective,
    RouterModule,
    PageHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EulaPageComponent {

  public breadcrumbs = [
    {
      breadcrumbs: [{ value: 'About', routerLink: '/about' }]
    }
  ];

  // A signal so the OnPush view repaints when the fetch resolves under zoneless CD.
  public readonly eulaHtml = signal('');

  // Load the EULA
  constructor() {
    const http = inject(HttpClient);

    http.get('/core/assets/eula.html', {responseType: 'text'}).subscribe(
      (html: string) => this.eulaHtml.set(html),
      () => this.eulaHtml.set('An error occurred retrieving the EULA')
    );
  }

}
