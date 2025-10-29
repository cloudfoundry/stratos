import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CustomTooltipDirective } from '@stratosui/core';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
selector: 'app-eula-page',
  templateUrl: './eula-page.component.html',
  styleUrls: ['./eula-page.component.scss'],
  standalone: true,
  imports: [
    CustomIconComponent,
    CustomTooltipDirective,
    RouterModule,
    PageHeaderComponent
  ]
})
export class EulaPageComponent {

  public breadcrumbs = [
    {
      breadcrumbs: [{ value: 'About', routerLink: '/about' }]
    }
  ];

  public eulaHtml = '';

  // Load the EULA
  constructor(http: HttpClient) {
    http.get('/core/assets/eula.html', {responseType: 'text'}).subscribe(
      (html: string) => this.eulaHtml = html,
      () => this.eulaHtml = 'An error occurred retrieving the EULA'
    );
  }

}
