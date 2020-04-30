import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-eula-page',
  templateUrl: './eula-page.component.html',
  styleUrls: ['./eula-page.component.scss']
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
      html => this.eulaHtml = html,
      () => this.eulaHtml = 'An error occurred retrieving the EULA'
    );
  }

}
