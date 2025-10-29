import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
selector: 'app-eula-page',
  templateUrl: './eula-page.component.html',
  styleUrls: ['./eula-page.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
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
